/* jshint curly:false */
/* jshint latedef:false */
/* global console */

define(['jquery', 'jquery-ui', 'knockout', 'lodash', 'bootstrap', 'Fuse'], function($, ui, ko, _, bootstrap, Fuse) {

  // secrets and constants
  var API_URL = 'https://weedmaps.com/dispensaries/native-roots-apothecary/menu_items.json';

  // instantiate MenuDataService
  var MenuData = new MenuDataService();

  // MenuItem constructor
  function MenuItem(item) {
    this.name = item.name;
    this.description = item.body;
    this.type = typeFilter(item.menu_item_category_id);
    this.price_gram = item.price_gram || undefined;
    this.price_eighth = item.price_eighth || undefined;
    this.price_quarter = item.price_quarter || undefined;
    this.price_unit = item.price_unit || undefined;
  }

  // view-model constructor
  function MenuViewModel() {
    var vm = this;

    // fetch menu data when this gets instantiated
    vm.menuItems = ko.observableArray();
    // autocomplete
    vm.selectedOption = ko.observable('');
    vm.nameOptions = ko.observableArray();
    // get this in a format for jquery-ui
    var unfilteredMenuItems;
    var namesArray;
    MenuData
      .fetchAllData()
      .success(function(data) {
        var mappedItems = _.map(data, function(item) {
          return new MenuItem(item);
        }).sort(sortAlphaByName);
        // make copy and stuff here to keep whole collection intact for use when filtering
        unfilteredMenuItems = _.cloneDeep(mappedItems);
        // building array of names to be used for fuzzy searching matching
        namesArray = _.pluck(mappedItems, 'name').sort();

        var nameOptions = namesArray.map(function(name) {
          return {
            label: name,
            value: name.toLowerCase()
          };
        });
        vm.nameOptions(nameOptions);

        // ko
        vm.menuItems(mappedItems);
      })
      .error(function(err) {
        console.log(err);
      });

    // filtering
    vm.currentFilter = ko.observable();
    vm.showFlowerOptions = ko.observable();
    vm.setFilter = function(type) {
      vm.currentFilter(type);
    };
    vm.filterMenuItems = ko.computed(function() {
      // just return items if no filter set
      if(!vm.currentFilter()) {
        vm.showFlowerOptions(false);
        return vm.menuItems(unfilteredMenuItems);
      }
      var newItems;
      if(vm.currentFilter() === 'flower') {
        // if they clicked flower, show the granular flower options
        vm.showFlowerOptions(true);
        // concats values from indica, sativa, and hybrid and returns unique, sorted values
        newItems = _.uniq(
          [].concat(
            getItemsOfType(_.cloneDeep(unfilteredMenuItems), 'indica'),
            getItemsOfType(_.cloneDeep(unfilteredMenuItems), 'sativa'),
            getItemsOfType(_.cloneDeep(unfilteredMenuItems), 'hybrid')
          )
        ).sort(sortAlphaByName);
      } else {
        // hide the flower options unless we're searchin for a flower type
        if( _.indexOf(['indica', 'sativa', 'hybrid'], vm.currentFilter()) > -1) {
          vm.showFlowerOptions(true);
        } else {
          vm.showFlowerOptions(false);
        }
        // filter out what we want based on type
        var clone = _.cloneDeep(unfilteredMenuItems);
        // ko
        newItems = getItemsOfType(clone, vm.currentFilter());
      }
      vm.menuItems(newItems);
    });
    // end filtering

    // custom binding handler for autocomplete widget
    ko.bindingHandlers.autoComplete = {
      // Only using init event because the Jquery.UI.AutoComplete widget will take care of the update callbacks
      init: function(element, valueAccessor) {
        // { selected: mySelectedOptionObservable, options: myArrayOfLabelValuePairs }
        var settings = valueAccessor();

        var selectedOption = settings.selected;
        var options = settings.options;

        var updateElementValueWithLabel = function(event, ui) {
          console.log('ui', ui);
          // Stop the default behavior
          event.preventDefault();

          // Update the value of the html element with the label
          // of the activated option in the list (ui.item)
          $(element).val(ui.item.label);

          // Update our SelectedOption observable
          if (typeof ui.item !== "undefined") {
            // ui.item - label|value|...
            selectedOption(ui.item);
          }
        };

        // options isn't actually the array it needs to be right here, but i cannot figure out why
        $(element).autocomplete({
          source: options,
          select: function(event, ui) {
            updateElementValueWithLabel(event, ui);
          },
          focus: function(event, ui) {
            updateElementValueWithLabel(event, ui);
          },
          change: function(event, ui) {
            updateElementValueWithLabel(event, ui);
          }
        });
      } // end init
    };


  } // MenuModel

  // MenuDataService
  function MenuDataService() {
    var self = this;

    self.fetchAllData = function() {
      return $.getJSON(API_URL);
    };
    // other data related methods here
  } // MenuDataService

  // returns type from menu_item_category_id
  // NOTE these may not be completely correct
  function typeFilter(id) {
    switch(id) {
      case 1:
        return 'indica';
      case 2:
        return 'sativa';
      case 3:
        return 'hybrid';
      case 4:
        return 'edible';
      case 5:
        return 'wax';
      case 6:
        return 'beverage';
      case 7:
        return 'n/a';
      case 8:
        return 'n/a';
      case 9:
        return 'concentrate';
      case 10:
        return 'accessory';
      case 11:
        return 'cream/balm';
      case 12:
        return 'pre-rolled';
    }
  }

  // returns items that match type
  function getItemsOfType(items, type) {
    return _.where(items, { 'type': type });
  }

  // sort arr of objs alphabetically by element.name
  function sortAlphaByName(a, b) {
    if(a.name[0] > b.name[0]) return 1;
    if(a.name[0] < b.name[0]) return -1;
    return 0;
  }

  $(function () {
    ko.applyBindings(new MenuViewModel(), document.getElementById('menu-view'));
  });

});
