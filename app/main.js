/* jshint latedef:false */
/* global console */

define(['jquery', 'knockout', 'lodash', 'bootstrap'], function($, ko, _) {

  // secrets and constants
  var API_URL = 'https://weedmaps.com/dispensaries/native-roots-apothecary/menu_items.json';

  // instantiate MenuDataService
  var MenuData = new MenuDataService();

  // MenuItem constructor
  function MenuItem(item) {
    this.name = item.name;
    this.description = item.body;
    this.type = typeFilter(item.menu_item_category_id);
    this.price_gram = item.price_gram || null;
    this.price_eighth = item.price_eighth || null;
    this.price_quarter = item.price_quarter || null;
    this.price_unit = item.price_unit || null;
  }

  // view-model constructor
  function MenuViewModel() {
    var vm = this;

    var unfilteredMenuItems;
    var namesArray;
    // fetch menu data when this gets instantiated
    vm.menuItems = ko.observableArray();
    MenuData
      .fetchAllData()
      .success(function(data) {
        var mappedItems = _.map(data, function(item) {
          return new MenuItem(item);
        }).sort(sortAlphaByName);
        // make copy and stuff here to keep whole collection intact for use when filtering
        unfilteredMenuItems = _.cloneDeep(mappedItems);
        // building array of names to be used for fuzzy searching matching
        namesArray = _.pluck(mappedItems, 'name');
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
    vm.searchInput = ko.observable();
    vm.searchInput.subscribe(function(newVal) {
      // filter our items
      var filtered = _.filter(unfilteredMenuItems, function(item) {
        if(item.name.toLowerCase().indexOf(newVal.toLowerCase()) > -1) {
          return true;
        }
        return false;
      });
      vm.menuItems(filtered);
    });

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
    if(a.name[0] > b.name[0]) {
      return 1;
    }
    if(a.name[0] < b.name[0]) {
      return -1;
    }
    return 0;
  }

  ko.applyBindings(new MenuViewModel(), document.getElementsByClassName('menu-view')[0]);
});
