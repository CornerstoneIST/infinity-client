(function() {
var customFields = [];
var assigneeUserId =null;
var workData = {};
var timeEntryType='';
var updateTaimeEntry ={};
  return {

    defaultState: 'loading',
    requests: {
     

      sendUsersData: function() {

        var  subdomain =  this.currentAccount().subdomain();
        var  userEmail = this.currentUser().email();
        var  zendeskToken = this.setting('zendeskToken');
        var  fbHost = this.setting('freshbookHost');
        var  fbToken = this.setting('freshbookToken');
        var  data = 'subdomain=' + subdomain + '&userEmail=' + userEmail + '&zendeskToken=' + zendeskToken + '&fbHost=' + fbHost + '&fbToken=' + fbToken;
      
        return {
          contentType: 'application/json',
          url: 'http://195.250.88.93:8081/createNewUser?'+data,
          type: 'GET'
         
        };
      },
      target: function(data){
        var customFieldsValue = '';
        for(var i=0; i < customFields.length; i++){
          customFieldsValue += ' '+customFields[i].key+' '+ customFields[i].value ;
        }
        var timeEntryData = '';
        if(timeEntryType)
            timeEntryData = '&workDescription='+workData.workDescription + '&startTime='+workData.startTime+'&endTime=' + workData.endTime+'&workHours='+workData.workHours + '&taskName=' +workData.taskName;

        var tiketData = 'id='+this.ticket().id() +'&userEmail=' + this.currentUser().email() +'&assignee_id=' + assigneeUserId +'&custom_fields=' + customFieldsValue +'&subject=' + this.ticket().subject() +'&description=' + this.ticket().description() + '&timeEntryType='+timeEntryType + timeEntryData;
    
         return {
          contentType: 'application/json',
          url: 'http://195.250.88.93:8081/ticketchanged?'+tiketData,
          type: 'GET'
        };
      },
      
      saveAutoStartTime:function(){
        var data = 'notes=' +  this.$('.automaticTimer textarea').val() +'&startTime=' + this.$('.autostart').html() + '&taskID=' + this.ticket().id();
         return {
          contentType: 'application/json',
          url: 'http://195.250.88.93:8081/saveAutoTimeEntry?'+data,
          type: 'GET',
          dataType: "json"
         
        };
      },

      getAutoTimeEntry:function(){
         var data = 'taskID=' + this.ticket().id();
         return {
          contentType: 'application/json',
          url: 'http://195.250.88.93:8081/getAutoTimeEntry?'+data,
          type: 'GET',
          dataType: "json"
         
        };
      },

      updateTimeEntry:function(){

         var data = 'id=' + updateTaimeEntry.id +'&hour=' + updateTaimeEntry.hour +'&note='+updateTaimeEntry.note + '&userEmail=' + this.currentUser().email()+'&taskID='+ this.ticket().id() +'&startTime='+updateTaimeEntry.startTime + '&endTime=' + updateTaimeEntry.endTime ;
         return {
          contentType: 'application/json',
          url: 'http://195.250.88.93:8081/updateTimeEntry?'+data,
          type: 'GET',
          dataType: "json"
         
        };
      },
      showTimeEntry:function(){
        var data = 'unserName='+this.currentUser().email()+'&task_id=' + this.ticket().id();
         return {
          contentType: 'application/json',
          url: 'http://195.250.88.93:8081/timeEntry?'+data,
          type: 'GET',
          dataType: "json"
         
        };
      }

    },

    // Here we define events such as a user clicking on something
    events: {

      // The app is active, so call requestBookmarks (L#65)
      'app.activated': 'appActivated',
      'showTimeEntry.done':'handleTimeEntry',
      'click .target': 'appTarget',
      'target.fail': 'handleTargetFail',
      'getAutoTimeEntry.done':'handleGetAutoTimeEntry',
      'click .updateDate':'updateDate',

      '*.changed': function(data) {
         var propertyName = data.propertyName;
         if(propertyName.indexOf('ticket.custom_field') != -1){
            var insert = true;
            for(var i=0; i<customFields.length; i++){
              if(customFields[i].key == data.propertyName){
                customFields[i].value = data.newValue;
                insert = false;
                break;
              }
            }
            if(insert){
              customFields.push({key:data.propertyName, value:data.newValue});
              }
         }
         else
           if(propertyName.indexOf('ticket.assignee.user.id')!= -1){
              assigneeUserId = data.newValue;
           }
      }

    },
    init: function(data) {
      this.ajax('showTimeEntry');
      this.switchTo('addtime');

      var customefieldsTemplate = this.renderTemplate('customefields',{});
      var menualTemplate = this.renderTemplate('menual',{});
      this.$('.menualTimer').append(menualTemplate);
      this.$('.customeFields').append(customefieldsTemplate);

      this.$('.start').html('<option>Start Time </option>'+this._addOptions(15));
      this.$('.end').html('<option value="end">End Time </option>'+this._addOptions(15));

      
      this.ajax('getAutoTimeEntry');
    },

    appActivated : function(data){
        if(data.firstLoad) {
          this.saveUserSettings();
        }
        this.renderTarget(data);
        this.init();
    },

    saveUserSettings : function(){
       this.ajax('sendUsersData');
    },

    renderTarget : function(data){
      this.userName = this.currentUser().name();
    },

    appTarget:function(data){
      timeEntryType = '';
      var autoStart =  this.$('.autostart').html();
      var autoEnd = this.$('.autoend').html();
          if(autoStart || autoEnd){
            if(autoStart && autoEnd){
              this.$('.menual').show();
              this.$('.disabledMenual').hide();
              this.$('.autostart').html('');
              this.$('.autoend').html('');
              timeEntryType = 'auto';
              this._timeEntry(this.$('.automaticTimer textarea').val(), autoStart, autoEnd);
            }
            else {
        this.ajax('saveAutoStartTime');
        this.$('.automaticTimer').hide();
      }
              
          }
          else{
            timeEntryType = 'menual';

             this._timeEntry(this.$('.menualTimer textarea').val(),this.$('.startTime').val(), this.$('.endTime').val());
          }
       this.$('.automaticTimer').hide();
      this.$('.menualTimer').hide();  
    },

    updateDate:function(){
     
      updateTaimeEntry.startTime = this.$('.edited .updateStart').val();
      updateTaimeEntry.endTime = this.$('.edited .updateEnd').val();
      updateTaimeEntry.hour = this._workHours( updateTaimeEntry.startTime, updateTaimeEntry.endTime);
      updateTaimeEntry.note = this.$('.edited textarea').val();
      updateTaimeEntry.id = this.$('.edited').attr('id');
       
      this.$('.edited .hour').text(updateTaimeEntry.hour);
      this.$('.edited select').hide();
      this.$('.edited button').hide();
      this.$('.edited .hour').show();
      this.ajax('updateTimeEntry');
    },
    handleTimeEntry:function(data){

      var timeEntryTemplate = this.renderTemplate('timeentry',{entryData:data});
         this.$('.timeEntry').append(timeEntryTemplate);
         this.$('.updateStart').html(this._addOptions(15));
         this.$('.updateEnd').html(this._addOptions(15));
         var self = this;
         self.$('.timeentryCont').each(function(){
            for(var i = 0; i < data.length ; i++){
              if(self.$(this).attr('id') == data[i].id){
                if(data[i].startTime){
                  self.$('#' +self.$(this).attr('id') +' .updateStart').val(data[i].startTime);
                  self.$('#' +self.$(this).attr('id') +' .updateEnd').val(data[i].endTime);
                }
                break;
              }
            }
         });
    },

    handleGetAutoTimeEntry:function(data){
       var automaticTemplate = this.renderTemplate('automatic',{interval:15, startTime: data.startTime, notes: data.notes});
      this.$('.automaticTimer').append(automaticTemplate);

    },
    
    handleTargetFail :function(data){
      alert('fail');
    },

    handleFail: function (data) {
      var response = JSON.parse(data.responseText);
      this.showError(response.error, response.description);
    },

     _addOptions:function(inc){
      var str = '';
      for(var i = 0 ; i < 2; i++){
        for(var j = 0; j<12; j++){
            var hour = (j > 0)? j : 12;
            var min = 0;
            while(min < 60){
             var amORpm = (i === 0)? 'am':'pm';
              var mStr = (min <10) ? '0'+min : min;
              var hStr = (hour <10) ? '0'+ hour : hour;
              var time = hStr + ':' + mStr + amORpm;
              str += '<option value = "'+ time +'">'+ time +'</option>';
              min += inc;
           }
        }
      }
      return str;
     
    },

    _workHours: function(start, end){
        var startLock = start.substr(start.length-2);
        var endLock = end.substr(end.length-2);

        var startH = (start.substring(0,1) > 0)? start.substring(0,2): start.substring(1,2);
        var endH = (end.substring(0,1) >0)? end.substring(0,2): end.substring(1,2);
       
        start = start.substring(3);
        end = end.substring(3);
        var startM = (start.substring(0,1) > 0)? start.substring(0,2): start.substring(1,2);
        var endM =  (end.substring(0,1) > 0)? end.substring(0,2) : end.substring(1,2);
        var workH=0, workM=0 ,em = 0, sm = 0;
        
       if(startLock === endLock ){

            startH = (startH === '12')? 0: startH*1;
            endH = (endH === '12')? 0: endH*1;
            if(startH > endH){
               workH = (24*60-((startH*60+startM*1) - (endH*60+endM*1)))/60;
            }
            if(startH<endH)
            {
              workH = ((endH*60 +endM*1) - (startH*60 + startM*1))/60;
            }
            else {
                if(startM < endM)
                  workH =  (endM - startM)/60;
                else  
                  workH = (24*60-((startH*60+startM*1) - (endH*60+endM*1)))/60;
            }

        }
        else {
             sm= (startH === '12')? 12*60 + startM*1 : (12-startH)*60 + startM*1;
             em= (endH === '12')? endM: endH*60 + endM*1;

              workH = (em*1 + sm*1)/60;
        }

        return workH;
    },
    _timeEntry: function(desc,start,end,type){

      if(start && end){
        var workHour =  this._workHours(start,end);
        var taskName = this.$('.customeFields select').val();
        alert(taskName);
        workData = {
          workHours: workHour,
          workDescription :desc,
          startTime: start,
          endTime: end,
          taskName: taskName
        };


       var timeEntryTemplate = this.renderTemplate('timeentry',{entryData:[{notes:desc, hour:workHour}]});
         this.$('.timeEntry').prepend(timeEntryTemplate);
         this.ajax('target');

         this.$('.menualTimer textarea').val('');
         this.$('#menualstart').val('start');
         this.$('#menualend').val('end');
         this.$('.startTime').val('');
         this.$('.endTime').val('');
         this.$('.menualTimer').hide();
         this.$('.customeFields select').val('');
       }
       else alert('check start and end times!');

        
    }
  
   
  };



}());