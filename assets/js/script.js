(function(document, $) {
  var ComicCache = (function() {
    // var contentDiv = $("#content");

    function remove(id) {
      if(localStorage[id]) {
        delete localStorage[id];
      }
    }

    function load() {
      if(localStorage.length > 0) {
        for(elem in localStorage) {
          if(elem === 'length') return;
          var elemProps = JSON.parse(localStorage[elem]);
          var mapping = {
            "bg": createBackgrounds,
            "page-title": createPageTitle,
            "asset": createAssets
          };
          // invoke appropriate render function based on type
          mapping[elemProps.type](elemProps);
        }
      }
    }

    function update(cacheKey, cacheObj) {
      if(localStorage[cacheKey]) {
        localStorage[cacheKey] = JSON.stringify(cacheObj);
      }
      else {
        localStorage.setItem(cacheKey, JSON.stringify(cacheObj));
      }
    }

    function get(id) {
      return JSON.parse(localStorage[id]);
    }

    function clear() {
      localStorage.clear();
    }

    return {
      load: load,
      remove: remove,
      update: update,
      get: get,
      clear: clear
    }
  })();

  $("#clear-cache").on("click", function() {
    // remove all existing assets & bgimages which are already set.
    ComicCache.clear();
  });

  // initially re-load from cache
  ComicCache.load();

  $("#page-title").on("blur", function() {
    createPageTitle({
      "id": $(this).attr("id"),
      "type": "page-title",
      "title": $(this).text()
    });
  });
  $("input[type=file]").on("change", evtChangeBackground);
  $(".image-url").on("change", evtChangeBackground);
  $(".item").on("click", function() {
    var selectedType = $(this).data("type");
    var isEditable = ($(this).data("editable")) ? true : false;
    var assetType = $(this).data("asset-type");
    createAssets({
      "type": selectedType,
      "editable": isEditable,
      "asset-type": assetType
    });
  });

  function evtChangeBackground(evt) {
    var uploadType = $(this).attr("type");
    var $imgcontainer = $(this).parent();
    
    if(uploadType === "file") {
      // assuming there will only be a single file.
      var file = this.files[0];       // Q: can you do something with the other attributes ?
      var reader = new FileReader();
      reader.addEventListener("load", function(evt) {
        // `reader.result` is the same as `evt.target.result`
        createBackgrounds({
          "type": "bg",
          "id": $imgcontainer.attr("id"),
          "blob": reader.result
        });
      });
      // this line will trigger the "load" and "loadend" event
      reader.readAsDataURL(file);
    } else if(uploadType === "text") {
      $imgcontainer.css("background-image", "url("+ $(this).val() +")");
      createBackgrounds({
        "type": "bg",
        "id": $imgcontainer.attr("id"),
        "blob": $(this).val()
      });
    }
  }

  /* caches the comic title */
  function createPageTitle(config) {
    if(!config.type) {
      console.error("You have to specify a background image.");
      return 0;
    }
    var pageTitle = config.title || "The Age of the Jaguar."
    $("#"+ config.id).text(pageTitle);
    ComicCache.update("pageTitle", config);
  }

  /* uploads comic frame images and stores it in cache */
  function createBackgrounds(config) {
    if(!config.type) {
      console.error("You have to specify a background image.");
      return 0;
    }
    var bgProps = {
      "type": config.type,
      "id": config.id,
      "blob": config.blob
    };
    $("#"+ bgProps.id).css({
      "background-image": "url("+ bgProps.blob +")",
      "background-size": "contain",
      "background-repeat": "no-repeat"
    });
    ComicCache.update(config.id, bgProps);
  }

  /* given a set of properties, returns an array of jquery elems */
  function createAssets(config) {
    if(!config.type) {
      console.error("You have to specify a type of element to create.");
      return 0;
    }
    // merge config with assetProps
    var assetProps = {
      "type": config["type"],
      "asset-type": config["asset-type"],
      "editable": config.editable,
      "id": config.id || "asset" + Math.floor(Math.random() * 1000),
      "left": config.left || Math.floor(Math.random() * 500),
      "top": config.top || Math.floor(Math.random() * 200),
      "class": config.class || "asset " + config["asset-type"],
      "text": config.text || ""
    };

    // create the asset with assigned properties
    var asset = $("<div>", {
      id: assetProps['id'],
      class: assetProps['class'],
      "data-type": assetProps['type'],
      "data-asset-type": assetProps['asset-type'],
      "data-editable": assetProps['editable']
    }).offset({
      "left": assetProps['left'],
      "top": assetProps['top']
    });

    var action_btns = $("<div>", {
      class: "btn_action_container",
    }).hide();

    var btn_close = $("<div>", {
      class: "btn_close btn_action"
    }).on("click", function() {
      var asset = $(this).closest(".asset");
      asset.remove();
      ComicCache.remove(asset.attr("id"));
    }).appendTo(action_btns);

    if(config.editable) {
      assetProps['editable'] = true;
      asset.append($("<p>")
        .on("blur", function() {
          // update the cache with the content
          var currAssetID = $(this).closest(".asset").attr("id");
          var currAssetProp = ComicCache.get(currAssetID);
          currAssetProp.text = $(this).text();
          ComicCache.update(currAssetID, currAssetProp);
        })
        .text(assetProps["text"])
        .attr("contenteditable", "true")
        .addClass("asset_txt"));
      var btn_edit = $("<div>", {
        class: "btn_edit btn_action"
      }).appendTo(action_btns);
    }

    asset.append(action_btns);
    asset.appendTo($("section#content"));
    asset.draggable({
      containment: "section#content",
      scroll: false,
      stop: function(evt) {
        // update cache
        var currElem = $(this);
        var updatedAssetProps = {
          "id": currElem.attr('id'),
          "left": currElem.offset()['left'],
          "top": currElem.offset()['top'],
          "class": currElem.attr('class'),
          "type": currElem.data('type'),
          "asset-type": currElem.data('asset-type'),
          "editable": (currElem.data('editable')) ? true : false,
          "text": currElem.text()
        };
        // update cache after element is moved around
        ComicCache.update(currElem.attr("id"), updatedAssetProps);
      }
    });
    asset.hover(function() {
      action_btns.toggle();
    });

    // update cache after element is loaded
    ComicCache.update(assetProps.id, assetProps);
  }

})(window.document, jQuery);
