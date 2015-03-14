var Cosmos =
/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};

/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {

/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;

/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};

/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);

/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;

/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}


/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;

/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;

/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";

/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ function(module, exports, __webpack_require__) {

	var _ = __webpack_require__(1),
	    Cosmos = __webpack_require__(2);

	_.extend(Cosmos.mixins, {
	  ClassName: __webpack_require__(3),
	  ComponentTree: __webpack_require__(4),
	  Router: __webpack_require__(5)
	});

	_.extend(Cosmos.components, {
	  ComponentPlayground: __webpack_require__(8)
	});

	module.exports = Cosmos;


/***/ },
/* 1 */
/***/ function(module, exports, __webpack_require__) {

	module.exports = _;

/***/ },
/* 2 */
/***/ function(module, exports, __webpack_require__) {

	var _ = __webpack_require__(1),
	    React = __webpack_require__(6),
	    router = __webpack_require__(9);

	module.exports = {
	  mixins: {},
	  components: {},

	  start: function(options) {
	    return new router.Router(_.extend({
	      onRender: this.render.bind(this)
	    }, options));
	  },

	  render: function(props, container, callback) {
	    var componentInstance = this.createElement(props);

	    if (container) {
	      return React.render(componentInstance, container, callback);
	    } else {
	      return React.renderToString(componentInstance);
	    }
	  },

	  createElement: function(props) {
	    var ComponentClass = this.getComponentByName(props.component,
	                                                 props.componentLookup);

	    if (!_.isFunction(ComponentClass)) {
	      throw new Error('Invalid component: ' + props.component);
	    }

	    return React.createElement(ComponentClass, props);
	  },

	  getComponentByName: function(name, componentLookup) {
	    if (_.isFunction(componentLookup)) {
	      var ComponentClass = componentLookup(name);

	      // Fall back to the Cosmos.components namespace if the lookup doesn't
	      // return anything. Needed for exposing built-in components in Cosmos
	      if (ComponentClass) {
	        return ComponentClass;
	      };
	    }

	    return this.components[name];
	  }
	};


/***/ },
/* 3 */
/***/ function(module, exports, __webpack_require__) {

	module.exports = {
	  getClassName: function(defaultClassName) {
	    if (this.props.className !== undefined) {
	      return this.props.className;
	    }
	    return defaultClassName;
	  }
	};


/***/ },
/* 4 */
/***/ function(module, exports, __webpack_require__) {

	var _ = __webpack_require__(1),
	    Cosmos = __webpack_require__(2);

	module.exports = {
	  /**
	   * Heart of the Cosmos framework. Links components with their children
	   * recursively. This makes it possible to inject nested state intro a tree of
	   * compoents, as well as serializing them into a single snapshot.
	   */
	  serialize: function(recursive) {
	    /**
	     * Generate a snapshot with the the props and state of a component
	     * combined, including the state of all nested child components.
	     */
	    // Current state should be used instead of initial one
	    var snapshot = _.omit(this.props, 'state'),
	        // Omit any child state that was previously passed through props
	        state = _.omit(this.state, 'children'),
	        children = {},
	        childSnapshot;

	    if (recursive) {
	      _.each(this.refs, function(child, ref) {
	        // We can only nest child state if the child component also uses the
	        // ComponentTree mixin
	        if (_.isFunction(child.serialize)) {
	          childSnapshot = child.serialize(true);

	          if (!_.isEmpty(childSnapshot.state)) {
	            children[ref] = childSnapshot.state;
	          }
	        }
	      });

	      if (!_.isEmpty(children)) {
	        state.children = children;
	      }
	    }

	    // There's no point in attaching the state key if the component nor its
	    // children have any state
	    if (!_.isEmpty(state)) {
	      snapshot.state = state;
	    }

	    return snapshot;
	  },

	  loadChild: function() {
	    var childProps = this.getChildProps.apply(this, arguments);

	    if (childProps) {
	      try {
	        return Cosmos.createElement(childProps);
	      } catch (e) {
	        console.error(e);
	      }
	    }

	    // Return null won't render any node
	    return null;
	  },

	  getChildProps: function(name) {
	    /**
	     * @param {String} name Key that corresponds to the child component we want
	     *                      to get the props for
	     * @param {...*} [arguments] Optional extra arguments get passed to the
	     *                           function that returns the component props
	     */
	    // https://github.com/petkaantonov/bluebird/wiki/Optimization-killers#32-leaking-arguments
	    var args = [];
	    for (var i = 1; i < arguments.length; ++i) {
	      args[i - 1] = arguments[i];
	    }

	    // The .children object on a component class contains a hash of functions.
	    // Keys in this hash represent the name and by default the *refs* of child
	    // components (unless changed via optional arguments passed in) and their
	    // values are functions that return props for each of those child
	    // components.
	    var props = this.children[name].apply(this, args);
	    if (!props) {
	      return;
	    }

	    if (!props.ref) {
	      props.ref = name;
	    }

	    // A tree of states can be embeded inside a single (root) component input,
	    // trickling down recursively all the way to the tree leaves. Child states
	    // are set inside the .children key of the parent component's state, as a
	    // hash with keys corresponding to component *refs*. These preset states
	    // will be overriden with those generated at run-time.
	    if (this._childSnapshots && this._childSnapshots[props.ref]) {
	      props.state = this._childSnapshots[props.ref];
	    }

	    if (this.props.componentLookup) {
	      props.componentLookup = this.props.componentLookup;
	    }

	    return props;
	  },

	  componentWillMount: function() {
	    // Allow passing of a serialized state snapshot through props
	    if (this.props.state) {
	      this._loadStateSnapshot(this.props.state);
	    }
	  },

	  componentDidMount: function() {
	    this._clearChildSnapshots();
	  },

	  _loadStateSnapshot: function(newState) {
	    // Child snapshots are read and flushed on every render (through the
	    // .children functions)
	    if (newState.children) {
	      this._childSnapshots = newState.children;
	    }

	    var defaultState = {};

	    // Allowing the new state to extend the initial set improves the brevity
	    // of component fixtures
	    if (_.isFunction(this.getInitialState)) {
	      _.extend(defaultState, this.getInitialState());
	    }

	    this.replaceState(_.extend(defaultState, newState));
	  },

	  _clearChildSnapshots: function() {
	    // Child snapshots are only used for first render after which organic
	    // states are formed
	    if (this._childSnapshots !== undefined) {
	      this._childSnapshots = undefined;
	    }
	  }
	};


/***/ },
/* 5 */
/***/ function(module, exports, __webpack_require__) {

	var serialize = __webpack_require__(7);

	module.exports = {
	  /**
	   * Enables basic linking between Components, with optional use of the minimal
	   * built-in Router.
	   */
	  getUrlFromProps: function(props) {
	    /**
	     * Serializes a props object into a browser-complient URL. The URL
	     * generated can be simply put inside the href attribute of an <a> tag, and
	     * can be combined with the serialize method of the ComponentTree Mixin to
	     * create a link that opens the current Component at root level
	     * (full window.)
	     */
	    return '?' + serialize.getQueryStringFromProps(props);
	  },

	  routeLink: function(event) {
	    /**
	     * Any <a> tag can have this method bound to its onClick event to have
	     * their corresponding href location picked up by the built-in Router
	     * implementation, which uses pushState to switch between Components
	     * instead of reloading pages.
	     */
	    event.preventDefault();
	    this.props.router.goTo(event.currentTarget.href);
	  }
	};


/***/ },
/* 6 */
/***/ function(module, exports, __webpack_require__) {

	module.exports = React;

/***/ },
/* 7 */
/***/ function(module, exports, __webpack_require__) {

	module.exports = {
	  getPropsFromQueryString: function(queryString) {
	    var props = {};

	    if (!queryString.length) {
	      return props;
	    }

	    var pairs = queryString.split('&'),
	        parts,
	        key,
	        value;

	    for (var i = 0; i < pairs.length; i++) {
	      parts = pairs[i].split('=');
	      key = parts[0];
	      value = decodeURIComponent(parts[1]);

	      try {
	        value = JSON.parse(value);
	      } catch (e) {
	        // If the prop was a simple type and not a stringified JSON it will
	        // keep its original value
	      }

	      props[key] = value;
	    }

	    return props;
	  },

	  getQueryStringFromProps: function(props) {
	    var parts = [],
	        value;

	    for (var key in props) {
	      value = props[key];

	      // Objects can be embedded in a query string as well
	      if (typeof value == 'object') {
	        try {
	          value = JSON.stringify(value);
	        } catch (e) {
	          // Props that can't be stringified should be ignored
	          continue;
	        }
	      }

	      parts.push(key + '=' + encodeURIComponent(value));
	    }

	    return parts.join('&');
	  }
	};


/***/ },
/* 8 */
/***/ function(module, exports, __webpack_require__) {

	__webpack_require__(12);

	var _ = __webpack_require__(1),
	    React = __webpack_require__(6),
	    classSet = React.addons.classSet,
	    ComponentTree = __webpack_require__(4),
	    RouterMixin = __webpack_require__(5);

	module.exports = React.createClass({
	  /**
	   * The Component Playground provides a minimal frame for loading React
	   * components in isolation. It can either render the component full-screen or
	   * with the navigation pane on the side.
	   */
	  displayName: 'ComponentPlayground',

	  mixins: [ComponentTree, RouterMixin],

	  propTypes: {
	    fixtures: React.PropTypes.object.isRequired,
	    fixturePath: React.PropTypes.string,
	    fixtureEditor: React.PropTypes.bool,
	    fullScreen: React.PropTypes.bool,
	    containerClassName: React.PropTypes.string
	  },

	  statics: {
	    getInitialState: function(fixtures, fixturePath) {
	      return {
	        expandedComponents: this.getExpandedComponents(fixturePath),
	        fixtureContents: this.getFixtureContents(fixtures, fixturePath),
	        fixtureUserInput: this.getFixtureUserInput(fixtures, fixturePath),
	        isFixtureUserInputValid: true
	      };
	    },

	    getExpandedComponents: function(fixturePath) {
	      var components = [];

	      // Expand the relevant component when a fixture is selected
	      if (fixturePath) {
	        components.push(this.getComponentName(fixturePath));
	      }

	      return components;
	    },

	    getFixtureUserInput: function(fixtures, fixturePath) {
	      if (!fixturePath) {
	        return '';
	      }

	      var contents = this.getFixtureContents(fixtures, fixturePath);
	      return JSON.stringify(contents, null, 2);
	    },

	    getFixtureContents: function(fixtures, fixturePath) {
	      if (!fixturePath) {
	        return null;
	      }

	      var componentName = this.getComponentName(fixturePath),
	          fixtureName = this.getFixtureName(fixturePath);

	      return fixtures[componentName][fixtureName];
	    },

	    getComponentName: function(fixturePath) {
	      return fixturePath.split('/')[0];
	    },

	    getFixtureName: function(fixturePath) {
	      return fixturePath.substr(fixturePath.indexOf('/') + 1);
	    }
	  },

	  getDefaultProps: function() {
	    return {
	      fixtureEditor: false,
	      fullScreen: false
	    };
	  },

	  getInitialState: function() {
	    return this.constructor.getInitialState(this.props.fixtures,
	                                            this.props.fixturePath);
	  },

	  children: {
	    preview: function() {
	      var fixturePath = this.props.fixturePath;

	      var props = {
	        component: this.constructor.getComponentName(fixturePath),
	        // Child should re-render whenever fixture changes
	        key: JSON.stringify(this.state.fixtureContents)
	      };

	      if (this.props.router) {
	        props.router = this.props.router;
	      }

	      return _.merge(props, this.state.fixtureContents);
	    }
	  },

	  render: function() {
	    var classes = classSet({
	      'component-playground': true,
	      'full-screen': this.props.fullScreen
	    });

	    return (
	      React.createElement("div", {className: classes}, 
	        React.createElement("div", {className: "header"}, 
	          this.props.fixturePath ? this._renderButtons() : null, 
	          React.createElement("h1", null, 
	            React.createElement("a", {href: "?", 
	               className: "home-link", 
	               onClick: this.routeLink}, 
	              React.createElement("span", {className: "react"}, "React"), " Component Playground"
	            ), 
	            React.createElement("span", {className: "cosmos-plug"}, 
	              'powered by ', 
	              React.createElement("a", {href: "https://github.com/skidding/cosmos"}, "Cosmos")
	            )
	          )
	        ), 
	        React.createElement("div", {className: "fixtures"}, 
	          this._renderFixtures()
	        ), 
	        this._renderContentFrame()
	      )
	    );
	  },

	  _renderFixtures: function() {
	    return React.createElement("ul", {className: "components"}, 
	      _.map(this.props.fixtures, function(fixtures, componentName) {

	        var classes = classSet({
	          'component': true,
	          'expanded':
	            this.state.expandedComponents.indexOf(componentName) !== -1
	        });

	        return React.createElement("li", {className: classes, key: componentName}, 
	          React.createElement("p", {className: "component-name"}, 
	            React.createElement("a", {href: "#toggle-component", 
	               onClick: _.partial(this.onComponentClick, componentName), 
	               ref: componentName + 'Button'}, 
	              componentName
	            )
	          ), 
	          this._renderComponentFixtures(componentName, fixtures)
	        );

	      }.bind(this))
	    )
	  },

	  _renderComponentFixtures: function(componentName, fixtures) {
	    return React.createElement("ul", {className: "component-fixtures"}, 
	      _.map(fixtures, function(props, fixtureName) {

	        var fixtureProps = {
	          fixturePath: componentName + '/' + fixtureName
	        };

	        if (this.props.fixtureEditor) {
	          fixtureProps.fixtureEditor = true;
	        }

	        return React.createElement("li", {className: this._getFixtureClasses(componentName,
	                                                      fixtureName), 
	                   key: fixtureName}, 
	          React.createElement("a", {href: this.getUrlFromProps(fixtureProps), 
	             onClick: this.routeLink}, 
	            fixtureName.replace(/-/g, ' ')
	          )
	        );

	      }.bind(this))
	    );
	  },

	  _renderContentFrame: function() {
	    return React.createElement("div", {className: "content-frame"}, 
	      React.createElement("div", {ref: "previewContainer", className: this._getPreviewClasses()}, 
	        this.props.fixturePath ? this.loadChild('preview') : null
	      ), 
	      this.props.fixtureEditor ? this._renderFixtureEditor() : null
	    )
	  },

	  _renderFixtureEditor: function() {
	    var editorClasses = classSet({
	      'fixture-editor': true,
	      'invalid-syntax': !this.state.isFixtureUserInputValid
	    });

	    return React.createElement("div", {className: "fixture-editor-outer"}, 
	      React.createElement("textarea", {ref: "fixtureEditor", 
	                className: editorClasses, 
	                value: this.state.fixtureUserInput, 
	                onChange: this.onFixtureChange}
	      )
	    );
	  },

	  _renderButtons: function() {
	    return React.createElement("ul", {className: "buttons"}, 
	      this._renderFixtureEditorButton(), 
	      this._renderFullScreenButton()
	    );
	  },

	  _renderFixtureEditorButton: function() {
	    var classes = classSet({
	      'fixture-editor-button': true,
	      'selected-button': this.props.fixtureEditor
	    });

	    var fixtureEditorUrl = this.getUrlFromProps({
	      fixturePath: this.props.fixturePath,
	      fixtureEditor: !this.props.fixtureEditor
	    });

	    return React.createElement("li", {className: classes}, 
	      React.createElement("a", {href: fixtureEditorUrl, 
	         ref: "fixtureEditorButton", 
	         onClick: this.routeLink}, "Editor")
	    );
	  },

	  _renderFullScreenButton: function() {
	    var fullScreenUrl = this.getUrlFromProps({
	      fixturePath: this.props.fixturePath,
	      fullScreen: true
	    });

	    return React.createElement("li", {className: "full-screen-button"}, 
	      React.createElement("a", {href: fullScreenUrl, 
	         ref: "fullScreenButton", 
	         onClick: this.routeLink}, "Fullscreen")
	    );
	  },

	  componentWillReceiveProps: function(nextProps) {
	    if (nextProps.fixturePath !== this.props.fixturePath) {
	      this.setState(this.constructor.getInitialState(nextProps.fixtures,
	                                                     nextProps.fixturePath));
	    }
	  },

	  onComponentClick: function(componentName, event) {
	    event.preventDefault();

	    var currentlyExpanded = this.state.expandedComponents,
	        componentIndex = currentlyExpanded.indexOf(componentName),
	        toBeExpanded;

	    if (componentIndex !== -1) {
	      toBeExpanded = _.clone(currentlyExpanded);
	      toBeExpanded.splice(componentIndex, 1);
	    } else {
	      toBeExpanded = currentlyExpanded.concat(componentName);
	    }

	    this.setState({expandedComponents: toBeExpanded});
	  },

	  onFixtureChange: function(event) {
	    var userInput = event.target.value,
	        newState = {fixtureUserInput: userInput};

	    try {
	      newState.fixtureContents = JSON.parse(userInput);
	      newState.isFixtureUserInputValid = true;
	    } catch (e) {
	      newState.isFixtureUserInputValid = false;
	      console.error(e);
	    }

	    this.setState(newState);
	  },

	  _getPreviewClasses: function() {
	    var classes = {
	      'preview': true,
	      'aside-fixture-editor': this.props.fixtureEditor
	    };

	    if (this.props.containerClassName) {
	      classes[this.props.containerClassName] = true;
	    }

	    return classSet(classes);
	  },

	  _getFixtureClasses: function(componentName, fixtureName) {
	    var classes = {
	      'component-fixture': true
	    };

	    var fixturePath = this.props.fixturePath;
	    if (fixturePath) {
	      var selectedComponentName =
	              this.constructor.getComponentName(fixturePath),
	          selectedFixtureName = this.constructor.getFixtureName(fixturePath);

	      classes['selected'] = componentName === selectedComponentName &&
	                            fixtureName === selectedFixtureName;
	    }

	    return classSet(classes);
	  }
	});


/***/ },
/* 9 */
/***/ function(module, exports, __webpack_require__) {

	module.exports = {
	  url: __webpack_require__(10),
	  Router: __webpack_require__(11)
	};


/***/ },
/* 10 */
/***/ function(module, exports, __webpack_require__) {

	var serialize = __webpack_require__(7);

	module.exports = {
	  getParams: function() {
	    return serialize.getPropsFromQueryString(this.getQueryString().substr(1));
	  },

	  isPushStateSupported: function() {
	    return !!window.history.pushState;
	  },

	  getQueryString: function() {
	    return window.location.search;
	  }
	};


/***/ },
/* 11 */
/***/ function(module, exports, __webpack_require__) {

	var _ = __webpack_require__(1),
	    serialize = __webpack_require__(7),
	    url = __webpack_require__(10);

	var Router = function(options) {
	  this._options = _.extend({
	    defaultProps: {},
	    container: document.body
	  }, options);

	  this.onPopState = this.onPopState.bind(this);
	  this._bindPopStateEvent();

	  // The initial render is done instantly when the Router instance is created
	  this._load(url.getParams(), window.location.href);
	};

	Router.prototype = {
	  stop: function() {
	    this._unbindPopStateEvent();
	  },

	  goTo: function(href) {
	    // Old-school refreshes are made when pushState isn't supported
	    if (!url.isPushStateSupported()) {
	      window.location = href;
	      return;
	    }

	    // The history entry for the previous component is updated with its
	    // lastest props and state, so that we resume it its exact form when/if
	    // going back
	    if (this.rootComponent) {
	      var snapshot = this.rootComponent.serialize(true);
	      this._replaceHistoryState(this._excludeDefaultProps(snapshot),
	                                this._currentHref);
	    }

	    var queryString = href.split('?').pop(),
	        props = serialize.getPropsFromQueryString(queryString);

	    // Calling pushState programatically doesn't trigger the onpopstate
	    // event, only a browser page change does. Otherwise this would've
	    // triggered an infinite loop.
	    // https://developer.mozilla.org/en-US/docs/Web/API/window.onpopstate
	    this._pushHistoryState(props, href);

	    this._load(props, href);
	  },

	  onPopState: function(e) {
	    // Chrome & Safari trigger an empty popState event initially, while
	    // Firefox doesn't, we choose to ignore that event altogether
	    if (!e.state) {
	      return;
	    }
	    this._load(e.state, window.location.href);
	  },

	  _load: function(newProps, href) {
	    var baseProps = {
	      // Always send the components a reference to the router. This makes it
	      // possible for a component to change the page through the router and
	      // not have to rely on any sort of globals
	      router: this
	    };
	    var props = _.extend(baseProps, this._options.defaultProps, newProps);

	    // The router exposes the instance of the currently rendered component
	    this.rootComponent = this._options.onRender(props,
	                                                this._options.container);

	    // We use the current href when updating the current history entry
	    this._currentHref = href;

	    if (_.isFunction(this._options.onChange)) {
	      this._options.onChange.call(this, newProps);
	    }
	  },

	  _bindPopStateEvent: function() {
	    window.addEventListener('popstate', this.onPopState);
	  },

	  _unbindPopStateEvent: function() {
	    window.removeEventListener('popstate', this.onPopState);
	  },

	  _replaceHistoryState: function(state, url) {
	    window.history.replaceState(state, '', url);
	  },

	  _pushHistoryState: function(state, url) {
	    window.history.pushState(state, '', url);
	  },

	  _excludeDefaultProps: function(props) {
	    var newProps = {},
	        value;

	    for (var key in props) {
	      // Ignore the Router reference because it gets attached automatically
	      // when sending new props to a component
	      if (key === 'router') {
	        continue;
	      }

	      value = props[key];

	      if (value !== this._options.defaultProps[key]) {
	        newProps[key] = value;
	      }
	    }

	    return newProps;
	  }
	};

	module.exports = Router;


/***/ },
/* 12 */
/***/ function(module, exports, __webpack_require__) {

	// style-loader: Adds some css to the DOM by adding a <style> tag

	// load the styles
	var content = __webpack_require__(13);
	if(typeof content === 'string') content = [[module.id, content, '']];
	// add the styles to the DOM
	var update = __webpack_require__(14)(content, {});
	// Hot Module Replacement
	if(false) {
		// When the styles change, update the <style> tags
		module.hot.accept("!!/Users/ovidiu/Dropbox/Work/cosmos/node_modules/css-loader/index.js!/Users/ovidiu/Dropbox/Work/cosmos/node_modules/less-loader/index.js!/Users/ovidiu/Dropbox/Work/cosmos/components/component-playground.less", function() {
			var newContent = require("!!/Users/ovidiu/Dropbox/Work/cosmos/node_modules/css-loader/index.js!/Users/ovidiu/Dropbox/Work/cosmos/node_modules/less-loader/index.js!/Users/ovidiu/Dropbox/Work/cosmos/components/component-playground.less");
			if(typeof newContent === 'string') newContent = [[module.id, newContent, '']];
			update(newContent);
		});
		// When the module is disposed, remove the <style> tags
		module.hot.dispose(function() { update(); });
	}

/***/ },
/* 13 */
/***/ function(module, exports, __webpack_require__) {

	exports = module.exports = __webpack_require__(15)();
	exports.push([module.id, ".component-playground {\n  position: absolute;\n  width: 100%;\n  height: 100%;\n  font-family: \"Helvetica Neue\", Helvetica, Arial, sans-serif;\n  font-size: 14px;\n}\n.component-playground .header {\n  position: absolute;\n  top: 0;\n  left: 0;\n  right: 0;\n  height: 50px;\n  background: #222;\n}\n.component-playground .header h1 {\n  margin: 0;\n  padding: 0 10px;\n  font-size: 22px;\n  font-weight: 400;\n  line-height: 50px;\n}\n.component-playground .header h1 .home-link {\n  color: #fafafa;\n  text-decoration: none;\n}\n.component-playground .header h1 .home-link .react {\n  color: #00d8ff;\n}\n.component-playground .header h1 .cosmos-plug {\n  margin-left: 10px;\n  color: #aaa;\n  font-size: 18px;\n}\n.component-playground .header h1 .cosmos-plug a {\n  color: #cc7a6f;\n  text-decoration: none;\n}\n.component-playground .header ul.buttons {\n  position: absolute;\n  top: 0;\n  right: 0;\n  margin: 0;\n  padding: 0;\n  list-style-type: none;\n}\n.component-playground .header ul.buttons li {\n  float: left;\n  height: 50px;\n  padding: 0 10px;\n  background: #222;\n  line-height: 50px;\n  letter-spacing: 1px;\n  text-transform: uppercase;\n  text-decoration: none;\n}\n.component-playground .header ul.buttons li.selected-button {\n  background: #000;\n}\n.component-playground .header ul.buttons li a {\n  color: #aaa;\n  text-decoration: none;\n}\n.component-playground .header ul.buttons li a:hover {\n  color: #fafafa;\n}\n.component-playground .fixtures {\n  position: absolute;\n  top: 50px;\n  bottom: 0;\n  left: 0;\n  width: 300px;\n  background: #2d2d2d;\n  overflow-x: hidden;\n  overflow-y: auto;\n}\n.component-playground .fixtures .components {\n  margin: 0;\n  padding: 0;\n  list-style-type: none;\n}\n.component-playground .fixtures .components .component .component-name {\n  margin: 0;\n  padding: 0;\n}\n.component-playground .fixtures .components .component .component-name a {\n  display: block;\n  height: 50px;\n  padding: 0 10px;\n  color: #aaa;\n  font-size: 16px;\n  line-height: 50px;\n  text-decoration: none;\n}\n.component-playground .fixtures .components .component .component-name a:hover {\n  color: #fafafa;\n}\n.component-playground .fixtures .components .component .component-fixtures {\n  display: none;\n  margin: 0;\n  padding: 5px 0;\n  background: #f3f3f3;\n  list-style-type: none;\n  overflow: hidden;\n}\n.component-playground .fixtures .components .component .component-fixtures .component-fixture {\n  margin: 0;\n  padding: 0;\n}\n.component-playground .fixtures .components .component .component-fixtures .component-fixture a {\n  display: block;\n  height: 30px;\n  padding: 0 10px;\n  color: #c05b4d;\n  line-height: 30px;\n  text-decoration: none;\n}\n.component-playground .fixtures .components .component .component-fixtures .component-fixture a:hover {\n  background: rgba(0, 0, 0, 0.05);\n}\n.component-playground .fixtures .components .component .component-fixtures .component-fixture.selected a {\n  font-weight: bold;\n}\n.component-playground .fixtures .components .component.expanded .component-fixtures {\n  display: block;\n}\n.component-playground .content-frame {\n  position: absolute;\n  top: 50px;\n  bottom: 0;\n  left: 300px;\n  right: 0;\n}\n.component-playground .content-frame .fixture-editor-outer {\n  position: absolute;\n  top: 0;\n  bottom: 0;\n  left: 0;\n  right: 50%;\n}\n.component-playground .content-frame .fixture-editor-outer .fixture-editor {\n  width: 100%;\n  height: 100%;\n  padding: 10px;\n  border: 1px solid rgba(16, 16, 16, 0.1);\n  background: #f8f5ec;\n  color: #637c84;\n  font-family: Menlo, Consolas, 'Courier New', monospace;\n  font-size: 13px;\n  line-height: 1.5em;\n  resize: none;\n  outline: none;\n}\n.component-playground .content-frame .fixture-editor-outer .fixture-editor.invalid-syntax {\n  color: #cc7a6f;\n}\n.component-playground .content-frame .preview {\n  position: absolute;\n  top: 0;\n  bottom: 0;\n  left: 0;\n  right: 0;\n  overflow: hidden;\n}\n.component-playground .content-frame .preview.aside-fixture-editor {\n  left: 50%;\n}\n.component-playground.full-screen > .header {\n  display: none;\n}\n.component-playground.full-screen > .fixtures {\n  display: none;\n}\n.component-playground.full-screen > .content-frame {\n  top: 0;\n  left: 0;\n}\n", ""]);

/***/ },
/* 14 */
/***/ function(module, exports, __webpack_require__) {

	/*
		MIT License http://www.opensource.org/licenses/mit-license.php
		Author Tobias Koppers @sokra
	*/
	var stylesInDom = {},
		memoize = function(fn) {
			var memo;
			return function () {
				if (typeof memo === "undefined") memo = fn.apply(this, arguments);
				return memo;
			};
		},
		isIE9 = memoize(function() {
			return /msie 9\b/.test(window.navigator.userAgent.toLowerCase());
		}),
		getHeadElement = memoize(function () {
			return document.head || document.getElementsByTagName("head")[0];
		}),
		singletonElement = null,
		singletonCounter = 0;

	module.exports = function(list, options) {
		if(false) {
			if(typeof document !== "object") throw new Error("The style-loader cannot be used in a non-browser environment");
		}

		options = options || {};
		// Force single-tag solution on IE9, which has a hard limit on the # of <style>
		// tags it will allow on a page
		if (typeof options.singleton === "undefined") options.singleton = isIE9();

		var styles = listToStyles(list);
		addStylesToDom(styles, options);

		return function update(newList) {
			var mayRemove = [];
			for(var i = 0; i < styles.length; i++) {
				var item = styles[i];
				var domStyle = stylesInDom[item.id];
				domStyle.refs--;
				mayRemove.push(domStyle);
			}
			if(newList) {
				var newStyles = listToStyles(newList);
				addStylesToDom(newStyles, options);
			}
			for(var i = 0; i < mayRemove.length; i++) {
				var domStyle = mayRemove[i];
				if(domStyle.refs === 0) {
					for(var j = 0; j < domStyle.parts.length; j++)
						domStyle.parts[j]();
					delete stylesInDom[domStyle.id];
				}
			}
		};
	}

	function addStylesToDom(styles, options) {
		for(var i = 0; i < styles.length; i++) {
			var item = styles[i];
			var domStyle = stylesInDom[item.id];
			if(domStyle) {
				domStyle.refs++;
				for(var j = 0; j < domStyle.parts.length; j++) {
					domStyle.parts[j](item.parts[j]);
				}
				for(; j < item.parts.length; j++) {
					domStyle.parts.push(addStyle(item.parts[j], options));
				}
			} else {
				var parts = [];
				for(var j = 0; j < item.parts.length; j++) {
					parts.push(addStyle(item.parts[j], options));
				}
				stylesInDom[item.id] = {id: item.id, refs: 1, parts: parts};
			}
		}
	}

	function listToStyles(list) {
		var styles = [];
		var newStyles = {};
		for(var i = 0; i < list.length; i++) {
			var item = list[i];
			var id = item[0];
			var css = item[1];
			var media = item[2];
			var sourceMap = item[3];
			var part = {css: css, media: media, sourceMap: sourceMap};
			if(!newStyles[id])
				styles.push(newStyles[id] = {id: id, parts: [part]});
			else
				newStyles[id].parts.push(part);
		}
		return styles;
	}

	function createStyleElement() {
		var styleElement = document.createElement("style");
		var head = getHeadElement();
		styleElement.type = "text/css";
		head.appendChild(styleElement);
		return styleElement;
	}

	function addStyle(obj, options) {
		var styleElement, update, remove;

		if (options.singleton) {
			var styleIndex = singletonCounter++;
			styleElement = singletonElement || (singletonElement = createStyleElement());
			update = applyToSingletonTag.bind(null, styleElement, styleIndex, false);
			remove = applyToSingletonTag.bind(null, styleElement, styleIndex, true);
		} else {
			styleElement = createStyleElement();
			update = applyToTag.bind(null, styleElement);
			remove = function () {
				styleElement.parentNode.removeChild(styleElement);
			};
		}

		update(obj);

		return function updateStyle(newObj) {
			if(newObj) {
				if(newObj.css === obj.css && newObj.media === obj.media && newObj.sourceMap === obj.sourceMap)
					return;
				update(obj = newObj);
			} else {
				remove();
			}
		};
	}

	function replaceText(source, id, replacement) {
		var boundaries = ["/** >>" + id + " **/", "/** " + id + "<< **/"];
		var start = source.lastIndexOf(boundaries[0]);
		var wrappedReplacement = replacement
			? (boundaries[0] + replacement + boundaries[1])
			: "";
		if (source.lastIndexOf(boundaries[0]) >= 0) {
			var end = source.lastIndexOf(boundaries[1]) + boundaries[1].length;
			return source.slice(0, start) + wrappedReplacement + source.slice(end);
		} else {
			return source + wrappedReplacement;
		}
	}

	function applyToSingletonTag(styleElement, index, remove, obj) {
		var css = remove ? "" : obj.css;

		if(styleElement.styleSheet) {
			styleElement.styleSheet.cssText = replaceText(styleElement.styleSheet.cssText, index, css);
		} else {
			var cssNode = document.createTextNode(css);
			var childNodes = styleElement.childNodes;
			if (childNodes[index]) styleElement.removeChild(childNodes[index]);
			if (childNodes.length) {
				styleElement.insertBefore(cssNode, childNodes[index]);
			} else {
				styleElement.appendChild(cssNode);
			}
		}
	}

	function applyToTag(styleElement, obj) {
		var css = obj.css;
		var media = obj.media;
		var sourceMap = obj.sourceMap;

		if(sourceMap && typeof btoa === "function") {
			try {
				css += "\n/*# sourceMappingURL=data:application/json;base64," + btoa(JSON.stringify(sourceMap)) + " */";
				css = "@import url(\"data:text/css;base64," + btoa(css) + "\")";
			} catch(e) {}
		}

		if(media) {
			styleElement.setAttribute("media", media)
		}

		if(styleElement.styleSheet) {
			styleElement.styleSheet.cssText = css;
		} else {
			while(styleElement.firstChild) {
				styleElement.removeChild(styleElement.firstChild);
			}
			styleElement.appendChild(document.createTextNode(css));
		}
	}


/***/ },
/* 15 */
/***/ function(module, exports, __webpack_require__) {

	module.exports = function() {
		var list = [];
		list.toString = function toString() {
			var result = [];
			for(var i = 0; i < this.length; i++) {
				var item = this[i];
				if(item[2]) {
					result.push("@media " + item[2] + "{" + item[1] + "}");
				} else {
					result.push(item[1]);
				}
			}
			return result.join("");
		};
		return list;
	}

/***/ }
/******/ ]);