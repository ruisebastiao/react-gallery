///////////////////////////////////////////////////////////////////////////////
// Autodesk.ADN.Viewing.Extension.ModelLoader
// by Philippe Leefsma, May 2015
//
///////////////////////////////////////////////////////////////////////////////
AutodeskNamespace("Autodesk.ADN.Viewing.Extension");

Autodesk.ADN.Viewing.Extension.ModelLoader = function (viewer, options) {
  
  Autodesk.Viewing.Extension.call(this, viewer, options);
  
  var _panel = null;
  
  /////////////////////////////////////////////
  // Extension load callback
  //
  /////////////////////////////////////////////
  this.load = function () {
    
    var ctrlGroup = getControlGroup();
    
    createControls(ctrlGroup);
    
    _panel = new Autodesk.ADN.Viewing.Extension.ModelLoader.Panel(
      viewer.container,
      guid());
    
    console.log('Autodesk.ADN.Viewing.Extension.ModelLoader loaded');
    
    return true;
  };
  
  /////////////////////////////////////////////
  //  Extension unload callback
  //
  /////////////////////////////////////////////
  this.unload = function () {
    
    try {
      
      var toolbar = viewer.getToolbar(true);
      
      toolbar.removeControl(
        'Autodesk.ADN.ModelLoader.ControlGroup');
    }
    catch (ex) {

      $('#divModelLoaderToolbar').remove();
    }
    
    console.log('Autodesk.ADN.Viewing.Extension.ModelLoader unloaded');
    
    return true;
  };
  
  /////////////////////////////////////////////
  //
  //
  /////////////////////////////////////////////
  function getControlGroup() {
    
    var toolbar = null;
    
    try {

      toolbar = viewer.getToolbar(true);
      
      if(!toolbar) {

        toolbar = createDivToolbar();
      }
    }
    catch (ex) {

      toolbar = createDivToolbar();
    }
    
    var control = toolbar.getControl(
      'Autodesk.ADN.ModelLoader.ControlGroup');
    
    if(!control) {
      
      control = new Autodesk.Viewing.UI.ControlGroup(
        'Autodesk.ADN.ModelLoader.ControlGroup');
      
      toolbar.addControl(control);
    }
    
    return control;
  }
  
  /////////////////////////////////////////////
  //
  //
  /////////////////////////////////////////////
  function createDivToolbar() {
    
    var toolbarDivHtml =
      '<div id="divModelLoaderToolbar"> </div>';
    
    $(viewer.container).append(toolbarDivHtml);
    
    $('#divModelLoaderToolbar').css({
      'bottom': '0%',
      'left': '50%',
      'z-index': '100',
      'position': 'absolute'
    });
    
    var toolbar = new Autodesk.Viewing.UI.ToolBar(true);
    
    $('#divModelLoaderToolbar')[0].appendChild(
      toolbar.container);
    
    return toolbar;
  }
  
  /////////////////////////////////////////////
  //
  //
  /////////////////////////////////////////////
  function createControls(parentGroup) {
    
    var btn = createButton(
      'model-loader-panel-show-button',
      'glyphicon glyphicon-list',
      'Load Model',
      onShowPanel);
    
    parentGroup.addControl(btn);
  }
  
  /////////////////////////////////////////////
  // Toggle visibility of panel
  //
  /////////////////////////////////////////////
  function onShowPanel() {
    
    _panel.toggleVisible();
  }
  
  /////////////////////////////////////////////
  //
  //
  /////////////////////////////////////////////
  function createButton(id, className, tooltip, handler) {
    
    var button = new Autodesk.Viewing.UI.Button(id);
    
    button.icon.style.fontSize = "24px";
    
    button.icon.className = className;
    
    button.setToolTip(tooltip);
    
    button.onClick = handler;
    
    return button;
  }
  
  /////////////////////////////////////////////
  //
  //
  /////////////////////////////////////////////
  function guid() {
    
    var d = new Date().getTime();
    
    var guid = 'xxxx-xxxx-xxxx-xxxx-xxxx'.replace(
      /[xy]/g,
      function (c) {
        var r = (d + Math.random() * 16) % 16 | 0;
        d = Math.floor(d / 16);
        return (c == 'x' ? r : (r & 0x7 | 0x8)).toString(16);
      });
    
    return guid;
  };

  /////////////////////////////////////////////
  // Get viewable path from urn and role
  //
  /////////////////////////////////////////////
  function getViewablePath(urn, role, onSuccess) {

    $.get('/node/ng-gallery/api/token', function(response){

      var options = {
        accessToken: response.access_token
      };

      Autodesk.Viewing.Initializer(options, function () {

        Autodesk.Viewing.Document.load(
          'urn:' + urn,
          function (document) {

            var rootItem = document.getRootItem();

            var geometryItems = Autodesk.Viewing.Document.
              getSubItemsWithProperties(
                rootItem, {
                  'type': 'geometry',
                  'role': role },
                true);

            if(geometryItems && geometryItems.length > 0){

              var path = document.getViewablePath(geometryItems[0]);

              onSuccess(path);
            }
          },
          function (msg) {

            console.log('Error loading document: ' + msg);
          });
      });
    });
  }

  /////////////////////////////////////////////
  // Get thumbnail
  //
  /////////////////////////////////////////////
  function getThumbnail(
    token,
    urn,
    onSuccess) {

    try {

      var xhr = new XMLHttpRequest();

      xhr.open('GET', 'https://developer.api.autodesk.com' +
        "/viewingservice/v1/thumbnails/" + urn,
        true);

      xhr.setRequestHeader(
        'Authorization',
        'Bearer ' + token);

      xhr.responseType = 'arraybuffer';

      xhr.onload = function (e) {

        if (this.status == 200) {

          //converts raw data to base64 img
          var base64 = btoa(String.fromCharCode.apply(
            null, new Uint8Array(this.response)));

          if(onSuccess)
            onSuccess(base64);
        }
      };

      xhr.send();
    }
    catch (ex) {

      console.log(ex);
    }
  };

  /////////////////////////////////////////////
  // Models Panel
  //
  /////////////////////////////////////////////
  Autodesk.ADN.Viewing.Extension.ModelLoader.Panel = function(
    parentContainer,
    id) {

    var _thisPanel = this;

    _thisPanel.content = document.createElement('div');

    Autodesk.Viewing.UI.DockingPanel.call(
      this,
      parentContainer,
      id,
      'Load Models',
      {shadow:true});

    _thisPanel.container.style.top = "0px";
    _thisPanel.container.style.left = "0px";

    _thisPanel.container.style.resize = "auto";
    _thisPanel.container.style.width = "300px";
    _thisPanel.container.style.height = "410px";

    _thisPanel.createScrollContainer({
      left: false,
      heightAdjustment: 45,
      marginTop:0
    });

    /////////////////////////////////////////////
    //
    //
    /////////////////////////////////////////////
    function addModelItem(token, model, idx) {

      var imgId = guid();

      var colors = ['#393B3D', '#CCCCCC'];

      var modelItem = [

        '<li class="model-loader-item" id="' + model._id  + '" style="list-style-type: none;">',
          '<a href="" id="' + model._id + '-link">',
            '<div class="row" style="background-color:' + colors[idx%2]+ '">',
              '<div class="col-md-3" style="margin-top: 5px; margin-bottom: 5px;">',
                '<img id="' + imgId + '" class="img-responsive" width="80" height="80"',
                'src="img/favicon.png"',
                'style="border: 1px solid; border-radius: 15px; margin-left: 10px">',
              '</div>',
              '<div class="col-md-5">',
                '<h3 style="margin-top: 30px;">' + model.name + '</h3>',
              '</div>',
            '</div>',
          '</a>',
        '</li>',

      ].join('\n');

      $('#' + id + '-modelList').append(modelItem);

      $('#' + model._id + '-link').click(function(e) {

        e.preventDefault();

        getViewablePath(model.urn, '3d', function(path){

          viewer.load(path);
        });

        return false;
      });

      getThumbnail(token, model.urn, function(thumbnail) {

        $('#' + imgId).attr(
          "src",
          "data:image/png;base64," + thumbnail);
      });
    }

    /////////////////////////////////////////////
    //
    //
    /////////////////////////////////////////////
    function loadModels() {

      $.get('/node/ng-gallery/api/models', function(models) {

        $.get('/node/ng-gallery/api/token', function(tokenResponse) {

          models.forEach(function (model, idx) {

            if(typeof model.name == 'undefined')
              return;

            addModelItem(
              tokenResponse.access_token,
              model,
              idx);
          });
        });
      });
    }

    /////////////////////////////////////////////
    //
    //
    /////////////////////////////////////////////
    function filterItems() {

      var filter = $('#' + id + '-filter').val();

      $("li.model-loader-item").each(function(index) {

        var $item = $(this);

        if(!filter.length || $item.text().indexOf(filter) > 0) {

          $item.css({
            'visibility':'visible'
          });
        }
        else {

          $item.css({
            'visibility':'hidden'
          });
        }
      });
    }

    /////////////////////////////////////////////
    //
    //
    /////////////////////////////////////////////
    var html = [
      '<input id="' + id +'-filter" type="text" class="form-control model-loader-search row" placeholder="Search Models ...">',
      '<ul id="' + id + '-modelList" style="padding:0">',
      '</ul>'
    ];

    $(this.scrollContainer).append(html.join('\n'));

    $('#' + id + '-filter').on('input', function() {

      filterItems();
    });

    loadModels();

    /////////////////////////////////////////////
    //
    //
    /////////////////////////////////////////////
    var visible = false;

    _thisPanel.toggleVisible = function() {

      visible = !visible;

      _thisPanel.setVisible(visible);
    }

    /////////////////////////////////////////////
    //
    //
    /////////////////////////////////////////////
    _thisPanel.setVisible = function(show) {

      visible = show;

      Autodesk.Viewing.UI.DockingPanel.prototype.
        setVisible.call(this, show);

      var $button = $('#model-loader-panel-show-button');

      if(show) {

        $button.addClass('active');
        $button.removeClass('inactive');
      }
      else {

        $button.addClass('inactive');
        $button.removeClass('active');
      }
    }

    /////////////////////////////////////////////
    //
    //
    /////////////////////////////////////////////
    _thisPanel.initialize = function() {

      this.title = this.createTitleBar(
        this.titleLabel ||
        this.container.id);

      this.closer = this.createCloseButton();

      this.container.appendChild(this.title);
      this.title.appendChild(this.closer);
      this.container.appendChild(this.content);

      this.initializeMoveHandlers(this.title);
      this.initializeCloseHandler(this.closer);
    };
  };
  
  Autodesk.ADN.Viewing.Extension.ModelLoader.Panel.prototype = Object.create(
    Autodesk.Viewing.UI.DockingPanel.prototype);
  
  Autodesk.ADN.Viewing.Extension.ModelLoader.Panel.prototype.constructor =
    Autodesk.ADN.Viewing.Extension.ModelLoader.Panel;

  var css = [

    '.model-loader-search {',
      'height: 20px;',
      'margin-left: 5px;',
      'width: calc(100% - 36px);',
      'margin-bottom: 5px;',
      'margin-top: 5px;',
    '}'

  ].join('\n');

  $('<style type="text/css">' + css + '</style>').appendTo('head');
};

Autodesk.ADN.Viewing.Extension.ModelLoader.prototype =
  Object.create(Autodesk.Viewing.Extension.prototype);

Autodesk.ADN.Viewing.Extension.ModelLoader.prototype.constructor =
  Autodesk.ADN.Viewing.Extension.ModelLoader;

Autodesk.Viewing.theExtensionManager.registerExtension(
  'Autodesk.ADN.Viewing.Extension.ModelLoader',
  Autodesk.ADN.Viewing.Extension.ModelLoader);