(function() {
var customFields = [];
var assigneeUserId =null;
var workData = {};
var timeEntryType='';
var updateTaimeEntry ={};


  return {

    defaultState: 'loading',
    // Here we define AJAX calls
    requests: {

      // An event will trigger when this request happens
      sendUsersData: function() { //first function connects zendesk and freshbooks

        var  subdomain =  this.currentAccount().subdomain(); //Gets Zendesk Subdomain
        var  userEmail = this.currentUser().email(); //Current Zendesk Agents Email Address
        var  zendeskToken = this.setting('zendeskToken'); //Zendesk Login token entered during application setup
        var  fbHost = this.setting('freshbookHost'); //Freshbooks host url (subdomain.freshbooks.com) entered during application setup
        var  fbToken = this.setting('freshbookToken'); //Freshbooks token associated with account entered during application setup
        var  data = 'subdomain=' + subdomain + '&userEmail=' + userEmail + '&zendeskToken=' + zendeskToken + '&fbHost=' + fbHost + '&fbToken=' + fbToken;

        return {
          contentType: 'application/json',
          url: 'http://api.wuzy.com/createNewUser?'+data,
          type: 'GET'

        };
      },

      target: function(data){ //Creates Target? Maybe defunct

        var timeEntryData = '';
        if(timeEntryType)
            timeEntryData = '&workDescription='+workData.workDescription + '&startTime='+workData.startTime+'&endTime=' + workData.endTime+'&workHours='+workData.workHours + '&taskName=' + workData.taskName + '&contractRate=' + workData.contractRate + '&contractType=' + workData.contractType + '&date=' + workData.date;

        var tiketData = 'id='+this.ticket().id() +'&userEmail=' + this.currentUser().email() +'&assignee_id=' + assigneeUserId +/*'&custom_fields=' + customFieldsValue +*/'&subject=' + this.ticket().subject() +'&description=' + this.ticket().description() + '&timeEntryType='+timeEntryType + timeEntryData;

         return {
          contentType: 'application/json',
          url: 'http://api.wuzy.com/ticketchanged?'+tiketData,
          //url: 'http://cornerstoneist/infinity-worker/ticketchanged?'+tiketData,
          type: 'GET'
        };
      },

      saveAutoStartTime:function(fieldsVal){
        var data = 'notes=' +  this.$('.automaticTimer textarea').val() +'&startTime=' + this.$('.autostart').html() + '&userEmail=' + this.currentUser().email()+'&ticketID=' + this.ticket().id() +'&fieldsVal=' + fieldsVal ;
         return {
          contentType: 'application/json',
          url: 'http://api.wuzy.com/saveAutoTimeEntry?'+data,
          type: 'GET',
          dataType: "json"

        };
      },

      getAutoTimeEntry:function(){
         var data = 'ticketID=' + this.ticket().id()+'&userEmail=' + this.currentUser().email();
         return {
          contentType: 'application/json',
          url: 'http://api.wuzy.com/getAutoTimeEntry?'+data,
          type: 'GET',
          dataType: "json"

        };
      },

      updateTimeEntry:function(){

         var data = 'id=' + updateTaimeEntry.id +'&hour=' + updateTaimeEntry.hour  + '&userEmail=' + this.currentUser().email()+'&taskID='+ this.ticket().id() +'&startTime='+updateTaimeEntry.startTime + '&endTime=' + updateTaimeEntry.endTime ;
         return {
          contentType: 'application/json',
          url: 'http://api.wuzy.com/updateTimeEntry?'+data,
          type: 'GET',
          dataType: "json"

        };
      },
      updateTaskType:function(){

         var data = 'taskId=' + updateTaimeEntry.taskId + '&taskName='+updateTaimeEntry.taskName + '&userEmail=' + this.currentUser().email() +'&id=' + updateTaimeEntry.id  +'&ticketID=' + this.ticket().id();
         return {
          contentType: 'application/json',
          url: 'http://api.wuzy.com/updateTaskType?'+data,
          type: 'GET',
          dataType: "json"

        };
      },
      showTimeEntry:function(){
        var data = 'unserName='+this.currentUser().email()+'&task_id=' + this.ticket().id();
         return {
          contentType: 'application/json',
          url: 'http://api.wuzy.com/timeEntry?'+data,
          type: 'GET',
          dataType: "json"

        };
      },
      getCustomeFields:function(){
        var data = 'unserName='+this.currentUser().email();
         return {
          contentType: 'application/json',
          url: 'http://api.wuzy.com/getcustomefields?'+data,
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
      'getCustomeFields.done': 'handleGetCustomeFields'


    },
    init: function(data) {

      this.ajax('showTimeEntry');
      this.switchTo('addtime');
      this.ajax('getCustomeFields');

      var externalDPTemplate = this.renderTemplate('datepicker',{});
      this.$('.externaldp').append(externalDPTemplate);

     var externaljsTemplate = this.renderTemplate('externaljs',{});
     this.$('.externallib').append(externaljsTemplate);

      var nowTemp = new Date();
      var month = nowTemp.getMonth() + 1;
       month = (month <10)? '0'+month:month;
      var curdate =nowTemp.getFullYear() + '-' + month + '-' + nowTemp.getDate();
      var menualTemplate = this.renderTemplate('menual',{date: curdate});
      this.$('.menualTimer').append(menualTemplate);

      var customeSelectStartTemplate = this.renderTemplate('customeselectbox',{defval:'Start Time', id:'menstartVal' });
      this.$('.menStart').append(customeSelectStartTemplate);
      this.$('.menStart ul').html('<li><a tabindex="-1" href="#" data-option="0">Start Time</a></li>'+ this._addLiOptions(15));

      var customeSelectEndTemplate = this.renderTemplate('customeselectbox',{defval:'End Time', id:'menendVal'});
      this.$('.menEnd').append(customeSelectEndTemplate);
      this.$('.menEnd ul').html('<li><a tabindex="-1" href="#" data-option="0">End Time</a></li>'+ this._addLiOptions(15));

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
              this._saveAutoStartTime();
              this.$('.automaticTimer').hide();
            }
          }
          else{
            timeEntryType = 'menual';
            this._timeEntry(this.$('.menualTimer textarea').val(), this.$('#menstartVal').val(), this.$('#menendVal').val());
          }
       this.$('.automaticTimer').hide();
       this.$('.menualTimer').hide();
    },

    handleTimeEntry:function(data){

      var timeEntryTemplate = this.renderTemplate('timeentry',{entryData:data});
         this.$('.timeEntry').append(timeEntryTemplate);


         var customefieldsTemplate = this.renderTemplate('customefields',{});
         this.$('.timeentryCont .taskType').append(customefieldsTemplate);

         var self = this;
         self.$('.timeentryCont').each(function(){
            for(var i = 0; i < data.length ; i++){
              if(self.$(this).attr('id') == data[i].id){
                if(data[i].startTime){

                  var updStartTemplate = self.renderTemplate('customeselectbox',{defval: data[i].startTime, id:'updStartVal' });
                  self.$('#' +self.$(this).attr('id') +' .updStart').html(updStartTemplate);
                  self.$('#' +self.$(this).attr('id') +' .updStart').find('ul').html(self._addLiOptions(15));

                  var updEndTemplate = self.renderTemplate('customeselectbox',{defval: data[i].endTime, id:'updEndVal' });
                  self.$('#' +self.$(this).attr('id') +' .updEnd').html(updEndTemplate);
                  self.$('#' +self.$(this).attr('id') +' .updEnd').find('ul').html(self._addLiOptions(15));

                  self.$('#' +self.$(this).attr('id') +' .taskType select').val(data[i].taskName.toLowerCase().replace(/\s/g, ''));
                }
                break;
              }
            }
         });

       self.$('.taskType select').change(function(){
        self._updateTaskType();
      });
       self.$('.timeentryCont .option-val').change(function(){
        self._updateDate();
       });

    },

    handleGetAutoTimeEntry:function(data){




      if(data.startTime){
        this.$('.menual').hide();
        this.$('.disabledMenual').show();
      }

      var automaticTemplate = this.renderTemplate('automatic',{interval:15, startTime:data.startTime, notes: data.notes});
      this.$('.automaticTimer').append(automaticTemplate);

     /*  var self = this;
       var index = 0;
       if(data.fields){
          self.$('.automaticTimer .custfields').each(function(){
              if(data.fields[index].taskName!='input'){
                console.log(data.fields[index].taskName);
                console.log(self.$(this).find('.val'));
                console.log('element');
                self.$(this).find('.val').val(data.fields[index].tagName);
                self.$(this).find('.bfh-selectbox-toggle').html(data.fields[index].taskName);
              }
              else
                self.$(this).find('.hourly').val(data.fields[index].tagName);
              index++;
          });
       }*/

    },

    handleGetCustomeFields:function(data){
     customFields = data;
     var customefieldsTemplate = this.renderTemplate('customefields',{customFields:data});
     this.$('.customeFieldsnew').append(customefieldsTemplate);


    },

    handleTargetFail :function(data){
      alert('fail');
    },

    handleFail: function (data) {
      var response = JSON.parse(data.responseText);
      this.showError(response.error, response.description);
    },
   _updateDate:function(){
      updateTaimeEntry.startTime = this.$('.edited #updStartVal').val();
      updateTaimeEntry.endTime = this.$('.edited #updEndVal').val();
      updateTaimeEntry.hour = this._workHours( updateTaimeEntry.startTime, updateTaimeEntry.endTime);

      updateTaimeEntry.id = this.$('.edited').attr('id');

      this.$('.edited .hour').text(updateTaimeEntry.hour);
      this.ajax('updateTimeEntry');
    },
    _updateTaskType: function(){

        updateTaimeEntry.taskName = this.$('.edited .taskType select').val();
        updateTaimeEntry.taskId = this.$('.edited .taskType').attr('id');
        updateTaimeEntry.id = this.$('.edited').attr('id');
        this.$('.edited .taskName').text(updateTaimeEntry.taskName);
        this.$('.taskType').hide();
        this.$('.edited .taskName').show();
        this.ajax('updateTaskType');
    },


    _saveAutoStartTime:function(){
      var fieldsVal = '';
      var self = this;
      self.$('.automaticTimer .custfields').each(function(){
        if(self.$(this).find('.val').val())
           fieldsVal  += '/' + self.$(this).find('.val').val();
        else
           fieldsVal  += '/'+self.$(this).find('.hourly').val();
      });
      self.ajax('saveAutoStartTime',fieldsVal);
    },

     _addLiOptions:function(inc){
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
              str += ' <li><a tabindex="-1" href="#" data-option="'+ time +'">'+ time +'</a></li>';
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
      var task = {};
      if(timeEntryType == 'auto')
       task =this._taskType(this.$('.automaticTimer')) ;
     else
       task = this._taskType(this.$('.menualTimer')) ;

      if(start && end && task.taskName){
        var workHour =  this._workHours(start,end);
        var nowTemp = new Date();
        var month = nowTemp.getMonth() + 1;
            month = (month <10)? '0'+month : month;
        var curdate =nowTemp.getFullYear() + '-' + month + '-' + nowTemp.getDate();
         //var taskName =(timeEntryType == 'auto')? this.$('.automaticTimer .customeFields select').val(): this.$('.menualTimer .customeFields select').val();
        var date = (timeEntryType == 'auto')? curdate: this.$('.menualTimer .dpvalue').val();
        workData = {
          workHours: workHour,
          workDescription :desc,
          startTime: start,
          endTime: end,
          taskName: task.taskName,
          contractType: task.contractType,
          contractRate: task.contractRate,
          date: date
        };

         var timeEntryTemplate = this.renderTemplate('timeentry',{entryData:[{taskName:task.taskName, hour:workHour, date:date}]});
         this.$('.timeEntry').prepend(timeEntryTemplate);
         this.ajax('target');

         this.$('.menualTimer .custfields .val').val('-');
         this.$('.menualTimer .custfields .bfh-selectbox-toggle').html('<span class="bfh-selectbox-option input-large" data-option="1">-</span><b class="caret"></b>');

          this.$('.automaticTimer .custfields .val').val('-');
         this.$('.automaticTimer .custfields .bfh-selectbox-toggle').html('<span class="bfh-selectbox-option input-large" data-option="1">-</span><b class="caret"></b>');

        var updStartTemplate = this.renderTemplate('customeselectbox',{defval: start, id:'updStartVal' });
        this.$('.updStart').eq(0).html(updStartTemplate);
        this.$('.updStart').eq(0).find('ul').html(this._addLiOptions(15));

        var updEndTemplate = this.renderTemplate('customeselectbox',{defval: end, id:'updEndVal' });
        this.$('.updEnd').eq(0).html(updEndTemplate);
        this.$('.updEnd').eq(0).find('ul').html(this._addLiOptions(15));

        var customefieldsTemplate = this.renderTemplate('customefields',{});
        this.$('.timeentryCont .taskType').eq(0).append(customefieldsTemplate);
       // this.$('.timeentryCont .taskType').eq(0).find('select').val(taskName);


        this.$('textarea').val('');
        var customeSelectStartTemplate = this.renderTemplate('customeselectbox',{defval:'Start Time', id:'menstartVal' });
        this.$('.menStart').html('');
        this.$('.menStart').html(customeSelectStartTemplate);
        this.$('.menStart ul').html('<li><a tabindex="-1" href="#" data-option="0">Start Time</a></li>'+ this._addLiOptions(15));

        var customeSelectEndTemplate = this.renderTemplate('customeselectbox',{defval:'End Time', id:'menendVal'});
        this.$('.menEnd').html('');
        this.$('.menEnd').html(customeSelectEndTemplate);
        this.$('.menEnd ul').html('<li><a tabindex="-1" href="#" data-option="0">End Time</a></li>'+ this._addLiOptions(15));

         this.$('.menualTimer').hide();
         this.$('.customeFields select').val('');

       }
       else alert('Please fill in all fields!');

    },

   _taskType:function(parent){
      var self = this ;
      var disBreack = true;
      var task = {};
      task.contractType = self.$(parent.selector).find('.contractType .val').val();
      var contType =  self.$(parent.selector).find('.contType').val();

      self.$(parent).find('.val').each(function(){
        var val = self.$(this).val();
          if(disBreack){
             for(var i = 0; i < customFields.length; i++){
              if(customFields[i].field.tagName != 'contractType' &&  customFields[i].field.tagName != 'rateType' && disBreack){
                 for(var j =0 ; j < customFields[i].options.length; j++ ){
                  if(customFields[i].options[j].tagName == val){
                     if(customFields[i].options[j].type == 'reset'){
                      task.contractRate = 0;
                      task.taskName = customFields[i].options[j].name;
                      disBreack = false;
                    }
                    else{
                      if(task.contractRate)
                       task.contractRate += customFields[i].options[j].rate*1;
                       else
                          task.contractRate =  customFields[i].options[j].rate*1;

                       if(task.taskName)
                         task.taskName =task.taskName+ ' - ' + customFields[i].options[j].name;
                       else  task.taskName = customFields[i].options[j].name;
                    }
                  }
                }
              }
            }
          }

        });

       if(contType == 'custom'){
        if(disBreack){
            task.contractRate = self.$(parent.selector).find('.rateType').find('input').val();
        }
       }

        return task;
    }

  };

}());