/**
 * @authors Luke Mahe
 * @authors Eric Bidelman
 * @fileoverview TODO
 */
document.cancelFullScreen = document.webkitCancelFullScreen ||
                            document.mozCancelFullScreen;

/**
 * @constructor
 */
function SlideDeck(el) {
  this.curSlide_ = 0;
  this.prevSlide_ = 0;
  this.config_ = null;
  this.container = el || document.querySelector('slides');
  this.slides = [];
  this.controller = null;

  this.titleSlideAnimationState_ = 0;

  this.getCurrentSlideFromHash_();

  // Call this explicitly. Modernizr.load won't be done until after DOM load.
  this.onDomLoaded_.bind(this)();

  // rotation trackers for rotatingCube slide.
  this.rotateX = 0;
  this.rotateY = 0;
  this.rotateZ = 0;
}

/**
 * @const
 * @private
 */
SlideDeck.prototype.SLIDE_CLASSES_ = [
  'far-past', 'past', 'current', 'next', 'far-next'];

/**
 * @const
 * @private
 */
SlideDeck.prototype.CSS_DIR_ = 'theme/css/';

/**
 * @private
 */
SlideDeck.prototype.getCurrentSlideFromHash_ = function() {
  var slideNo = parseInt(document.location.hash.substr(1));

  if (slideNo) {
    this.curSlide_ = slideNo - 1;
  } else {
    this.curSlide_ = 0;
  }
};

/**
 * @param {number} slideNo
 */
SlideDeck.prototype.loadSlide = function(slideNo) {
  if (slideNo) {
    this.curSlide_ = slideNo - 1;
    this.updateSlides_();
  }
};

/**
 * @private
 */
SlideDeck.prototype.onDomLoaded_ = function(e) {
  document.body.classList.add('loaded'); // Add loaded class for templates to use.

  this.slides = this.container.querySelectorAll('slide:not([hidden]):not(.backdrop)');

  // If we're on a smartphone, apply special sauce.
  if (Modernizr.mq('only screen and (max-device-width: 480px)')) {
    // var style = document.createElement('link');
    // style.rel = 'stylesheet';
    // style.type = 'text/css';
    // style.href = this.CSS_DIR_ + 'phone.css';
    // document.querySelector('head').appendChild(style);

    // No need for widescreen layout on a phone.
    this.container.classList.remove('layout-widescreen');
  }

  this.loadConfig_(SLIDE_CONFIG);
  this.addEventListeners_();
  this.updateSlides_();

  // Add slide numbers and total slide count metadata to each slide.
  var that = this;
  for (var i = 0, slide; slide = this.slides[i]; ++i) {
    slide.dataset.slideNum = i + 1;
    slide.dataset.totalSlides = this.slides.length;

    slide.addEventListener('click', function(e) {
      if (document.body.classList.contains('overview')) {
        that.loadSlide(this.dataset.slideNum);
        e.preventDefault();
        window.setTimeout(function() {
          that.toggleOverview();
        }, 500);
      }
    }, false);
  }

  // Note: this needs to come after addEventListeners_(), which adds a
  // 'keydown' listener that this controller relies on.
  // Also, no need to set this up if we're on mobile.
  if (!Modernizr.touch) {
    this.controller = new SlideController(this);
    if (this.controller.isPopup) {
      document.body.classList.add('popup');
    }
  }
};

/**
 * @private
 */
SlideDeck.prototype.addEventListeners_ = function() {
  document.addEventListener('keydown', this.onBodyKeyDown_.bind(this), false);
  window.addEventListener('popstate', this.onPopState_.bind(this), false);

  // var transEndEventNames = {
  //   'WebkitTransition': 'webkitTransitionEnd',
  //   'MozTransition': 'transitionend',
  //   'OTransition': 'oTransitionEnd',
  //   'msTransition': 'MSTransitionEnd',
  //   'transition': 'transitionend'
  // };
  // 
  // // Find the correct transitionEnd vendor prefix.
  // window.transEndEventName = transEndEventNames[
  //     Modernizr.prefixed('transition')];
  // 
  // // When slides are done transitioning, kickoff loading iframes.
  // // Note: we're only looking at a single transition (on the slide). This
  // // doesn't include autobuilds the slides may have. Also, if the slide
  // // transitions on multiple properties (e.g. not just 'all'), this doesn't
  // // handle that case.
  // this.container.addEventListener(transEndEventName, function(e) {
  //     this.enableSlideFrames_(this.curSlide_);
  // }.bind(this), false);

  // document.addEventListener('slideenter', function(e) {
  //   var slide = e.target;
  //   window.setTimeout(function() {
  //     this.enableSlideFrames_(e.slideNumber);
  //     this.enableSlideFrames_(e.slideNumber + 1);
  //   }.bind(this), 300);
  // }.bind(this), false);
};

/**
 * @private
 * @param {Event} e The pop event.
 */
SlideDeck.prototype.onPopState_ = function(e) {
  if (e.state != null) {
    this.curSlide_ = e.state;
    this.updateSlides_(true);
  }
};

/**
 * @param {Event} e
 */
SlideDeck.prototype.onBodyKeyDown_ = function(e) {
  if (/^(input|textarea)$/i.test(e.target.nodeName) ||
      e.target.isContentEditable) {
    return;
  }

  // Forward keydowns to the main slides if we're the popup.
  if (this.controller && this.controller.isPopup) {
    this.controller.sendMsg({keyCode: e.keyCode});
  }

  // Special keycodes handelling for the rotating cube slide.
  if (this.slides[this.curSlide_].id == 'rotatingCubeSlide') {
	var diff = 90;
   // Handle Keys 1 to 6.
	switch(e.keyCode) {
		case 49: // 1
		  this.rotateY -= diff;
		  break;
		case 50:  // 2
		  this.rotateY += diff;
		  break;
		case 51: // 3
		  this.rotateX += diff;
		  break;
		case 52:  // 4
		  this.rotateX -= diff;
		  break;
		case 53: // 5
		  this.rotateZ += diff;
		  break;
		case 54:  // 6
		  this.rotateZ -= diff;
	}
	var rX = "rotateX(" + this.rotateX + "deg) "; 
	var rY = "rotateY(" + this.rotateY + "deg) ";
	var rZ = "rotateZ(" + this.rotateZ + "deg) ";
	document.getElementById("cubeInner").style.webkitTransform = rX + rY + rZ;
  }

  switch (e.keyCode) {
    case 13: // Enter
      if (document.body.classList.contains('overview')) {
        this.toggleOverview();
      }
      break;

    case 39: // right arrow
    case 32: // space
    case 34: // PgDn
    case 40: // DownArrow
      if (this.curSlide_ != 1) {
        this.nextSlide();
      } else {
	    if (this.titleSlideAnimationState_ == 0) {
		  animateTitlePart1();
		  this.titleSlideAnimationState_ = 1;
		} else if (this.titleSlideAnimationState_ == 1){
		  animateTitlePart2();
		  this.titleSlideAnimationState_ = 2;
	    } else if (this.titleSlideAnimationState_ == 2) {
	      animateTitlePart3();
		  this.titleSlideAnimationState_ = 3;
	    } else {
		  this.nextSlide();
	    }
	  }
	  e.preventDefault();
	  break;

    case 37: // left arrow
    case 8: // Backspace
    case 33: // PgUp
    case 38: // up arrow
      this.prevSlide();
      e.preventDefault();
      break;

    case 79: // O: Toggle overview
      this.toggleOverview();
      break;

    case 80: // P
      if (this.controller && this.controller.isPopup) {
        document.body.classList.toggle('with-notes');
      } else if (this.controller && !this.controller.popup) {
        document.body.classList.toggle('with-notes');
      }
      break;

    case 82: // R
      // TODO: implement refresh on main slides when popup is refreshed.
      break;

    case 27: // ESC: Hide notes and highlighting
      document.body.classList.remove('with-notes');
      document.body.classList.remove('highlight-code');

      if (document.body.classList.contains('overview')) {
        this.toggleOverview();
      }
      break;

    case 70: // F: Toggle fullscreen
       // Only respect 'f' on body. Don't want to capture keys from an <input>.
       // Also, ignore browser's fullscreen shortcut (cmd+shift+f) so we don't
       // get trapped in fullscreen!
      if (e.target == document.body && !(e.shiftKey && e.metaKey)) {
        if (document.mozFullScreen !== undefined && !document.mozFullScreen) {
          document.body.mozRequestFullScreen(Element.ALLOW_KEYBOARD_INPUT);
        } else if (document.webkitIsFullScreen !== undefined && !document.webkitIsFullScreen) {
          document.body.webkitRequestFullScreen(Element.ALLOW_KEYBOARD_INPUT);
        } else {
          document.cancelFullScreen();
        }
      }
      break;

    case 87: // W: Toggle widescreen
      // Only respect 'w' on body. Don't want to capture keys from an <input>.
      if (e.target == document.body && !(e.shiftKey && e.metaKey)) {
        this.container.classList.toggle('layout-widescreen');
      }
      break;
  }
};


/**
 *
 */
SlideDeck.prototype.focusOverview_ = function() {
  var overview = document.body.classList.contains('overview');

  for (var i = 0, slide; slide = this.slides[i]; i++) {
    slide.style[Modernizr.prefixed('transform')] = overview ?
        'translateZ(-2500px) translate(' + (( i - this.curSlide_ ) * 105) +
                                       '%, 0%)' : '';
  }
};

/**
 */
SlideDeck.prototype.toggleOverview = function() {
  document.body.classList.toggle('overview');

  this.focusOverview_();
};

/**
 * @private
 */
SlideDeck.prototype.loadConfig_ = function(config) {
  if (!config) {
    return;
  }

  this.config_ = config;

  var settings = this.config_.settings;

  this.loadTheme_(settings.theme || []);

  if (settings.favIcon) {
    this.addFavIcon_(settings.favIcon);
  }

  // Prettyprint. Default to on.
  if (!!!('usePrettify' in settings) || settings.usePrettify) {
    prettyPrint();
  }

  if (settings.analytics) {
    this.loadAnalytics_();
  }

  if (settings.fonts) {
    this.addFonts_(settings.fonts);
  }

  // Builds. Default to on.
  if (!!!('useBuilds' in settings) || settings.useBuilds) {
    this.makeBuildLists_();
  }

  if (settings.title) {
    document.title = settings.title.replace(/<br\/?>/, ' ') + ' - g|india';
    //document.querySelector('[data-config-title]').innerHTML = settings.title;
  }

  if (settings.subtitle) {
    //document.querySelector('[data-config-subtitle]').innerHTML = settings.subtitle;
  }

  if (this.config_.presenters) {
    var presenters = this.config_.presenters;
    var dataConfigContact = document.querySelector('[data-config-contact]');

    var html = [];
    if (presenters.length == 1) {
      var p = presenters[0];

      html = [p.name, p.company].join('<br>');

      var gplus = p.gplus ? '<span>g+</span><a href="' + p.gplus +
          '">' + p.gplus.replace(/https?:\/\//, '') + '</a>' : '';

      var twitter = p.twitter ? '<span>twitter</span>' +
          '<a href="http://twitter.com/' + p.twitter + '">' +
          p.twitter + '</a>' : '';

      var www = p.www ? '<span>www</span><a href="' + p.www +
                        '">' + p.www.replace(/https?:\/\//, '') + '</a>' : '';

      var github = p.github ? '<span>github</span><a href="' + p.github +
          '">' + p.github.replace(/https?:\/\//, '') + '</a>' : '';

      var html2 = [gplus, twitter, www, github].join('<br>');

      if (dataConfigContact) {
        dataConfigContact.innerHTML = html2;
      }
    } else {
      for (var i = 0, p; p = presenters[i]; ++i) {
        html.push(p.name + ' - ' + p.company);
      }
      html = html.join('<br>');
      if (dataConfigContact) {
        dataConfigContact.innerHTML = html;
      }
    }

    var dataConfigPresenter = document.querySelector('[data-config-presenter]');
    if (dataConfigPresenter) {
      document.querySelector('[data-config-presenter]').innerHTML = html;
    }
  }

  /* Left/Right tap areas. Default to including. */
  if (!!!('enableSlideAreas' in settings) || settings.enableSlideAreas) {
    var el = document.createElement('div');
    el.classList.add('slide-area');
    el.id = 'prev-slide-area';
    el.addEventListener('click', this.prevSlide.bind(this), false);
    this.container.appendChild(el);

    var el = document.createElement('div');
    el.classList.add('slide-area');
    el.id = 'next-slide-area';
    el.addEventListener('click', this.nextSlide.bind(this), false);
    this.container.appendChild(el);
  }

  if (Modernizr.touch && (!!!('enableTouch' in settings) ||
      settings.enableTouch)) {
    var self = this;

    // Note: this prevents mobile zoom in/out but prevents iOS from doing
    // it's crazy scroll over effect and disaligning the slides.
    window.addEventListener('touchstart', function(e) {
      e.preventDefault();
    }, false);

    var hammer = new Hammer(this.container);
    hammer.ondragend = function(e) {
      if (e.direction == 'right' || e.direction == 'down') {
        self.prevSlide();
      } else if (e.direction == 'left' || e.direction == 'up') {
        self.nextSlide();
      }
    };
  }
};

/**
 * @private
 * @param {Array.<string>} fonts
 */
SlideDeck.prototype.addFonts_ = function(fonts) {
  var el = document.createElement('link');
  el.rel = 'stylesheet';
  el.href = ('https:' == document.location.protocol ? 'https' : 'http') +
      '://fonts.googleapis.com/css?family=' + fonts.join('|') + '&v2';
  document.querySelector('head').appendChild(el);
};

/**
 * @private
 */
SlideDeck.prototype.buildNextItem_ = function() {
  var slide = this.slides[this.curSlide_];
  var toBuild = slide.querySelector('.to-build');
  var built = slide.querySelector('.build-current');

  if (built) {
    built.classList.remove('build-current');
    if (built.classList.contains('fade')) {
      built.classList.add('build-fade');
    }
  }

  if (!toBuild) {
    var items = slide.querySelectorAll('.build-fade');
    for (var j = 0, item; item = items[j]; j++) {
      item.classList.remove('build-fade');
    }
    return false;
  }

  toBuild.classList.remove('to-build');
  toBuild.classList.add('build-current');

  return true;
};

/**
 * @param {boolean=} opt_dontPush
 */
SlideDeck.prototype.prevSlide = function(opt_dontPush) {
  if (this.curSlide_ > 0) {
    var bodyClassList = document.body.classList;
    bodyClassList.remove('highlight-code');

    // Toggle off speaker notes if they're showing when we move backwards on the
    // main slides. If we're the speaker notes popup, leave them up.
    if (this.controller && !this.controller.isPopup) {
      bodyClassList.remove('with-notes');
    } else if (!this.controller) {
      bodyClassList.remove('with-notes');
    }

    this.prevSlide_ = this.curSlide_--;

    this.updateSlides_(opt_dontPush);
  }
};

/**
 * @param {boolean=} opt_dontPush
 */
SlideDeck.prototype.nextSlide = function(opt_dontPush) {
  if (!document.body.classList.contains('overview') && this.buildNextItem_()) {
    return;
  }

  if (this.curSlide_ < this.slides.length - 1) {
    var bodyClassList = document.body.classList;
    bodyClassList.remove('highlight-code');

    // Toggle off speaker notes if they're showing when we advanced on the main
    // slides. If we're the speaker notes popup, leave them up.
    if (this.controller && !this.controller.isPopup) {
      bodyClassList.remove('with-notes');
    } else if (!this.controller) {
      bodyClassList.remove('with-notes');
    }

    this.prevSlide_ = this.curSlide_++;

    this.updateSlides_(opt_dontPush);
  }
};

/* Slide events */

/**
 * Triggered when a slide enter/leave event should be dispatched.
 *
 * @param {string} type The type of event to trigger
 *     (e.g. 'slideenter', 'slideleave').
 * @param {number} slideNo The index of the slide that is being left.
 */
SlideDeck.prototype.triggerSlideEvent = function(type, slideNo) {
  var el = this.getSlideEl_(slideNo);
  if (!el) {
    return;
  }

  // Call onslideenter/onslideleave if the attribute is defined on this slide.
  var func = el.getAttribute(type);
  if (func) {
	new Function(func).call(el); // TODO: Don't use new Function() :(
  }

  // Dispatch event to listeners setup using addEventListener.
  var evt = document.createEvent('Event');
  evt.initEvent(type, true, true);
  evt.slideNumber = slideNo + 1; // Make it readable
  evt.slide = el;

  el.dispatchEvent(evt);
};

/**
 * @private
 */
SlideDeck.prototype.updateSlides_ = function(opt_dontPush) {
  var dontPush = opt_dontPush || false;

  var curSlide = this.curSlide_;
  for (var i = 0; i < this.slides.length; ++i) {
    switch (i) {
      case curSlide - 2:
        this.updateSlideClass_(i, 'far-past');
        break;
      case curSlide - 1:
        this.updateSlideClass_(i, 'past');
        break;
      case curSlide:
        this.updateSlideClass_(i, 'current');
        break;
      case curSlide + 1:
        this.updateSlideClass_(i, 'next');
        break;
      case curSlide + 2:
        this.updateSlideClass_(i, 'far-next');
        break;
      default:
        this.updateSlideClass_(i);
        break;
    }
  };

  this.triggerSlideEvent('slideleave', this.prevSlide_);
  this.triggerSlideEvent('slideenter', curSlide);
  this.triggerSlideEvent('onslideenter', curSlide);

// window.setTimeout(this.disableSlideFrames_.bind(this, curSlide - 2), 301);
// 
// this.enableSlideFrames_(curSlide - 1); // Previous slide.
// this.enableSlideFrames_(curSlide + 1); // Current slide.
// this.enableSlideFrames_(curSlide + 2); // Next slide.

   // Enable current slide's iframes (needed for page loat at current slide).
   this.enableSlideFrames_(curSlide + 1);

   // No way to tell when all slide transitions + auto builds are done.
   // Give ourselves a good buffer to preload the next slide's iframes.
   window.setTimeout(this.enableSlideFrames_.bind(this, curSlide + 2), 1000);

  this.updateHash_(dontPush);

  if (document.body.classList.contains('overview')) {
    this.focusOverview_();
    return;
  }

};

/**
 * @private
 * @param {number} slideNo
 */
SlideDeck.prototype.enableSlideFrames_ = function(slideNo) {
  var el = this.slides[slideNo - 1];
  if (!el) {
    return;
  }

  var frames = el.querySelectorAll('iframe');
  for (var i = 0, frame; frame = frames[i]; i++) {
    this.enableFrame_(frame);
  }
};

/**
 * @private
 * @param {number} slideNo
 */
SlideDeck.prototype.enableFrame_ = function(frame) {
  var src = frame.dataset.src;
  if (src && frame.src != src) {
    frame.src = src;
  }
};

/**
 * @private
 * @param {number} slideNo
 */
SlideDeck.prototype.disableSlideFrames_ = function(slideNo) {
  var el = this.slides[slideNo - 1];
  if (!el) {
    return;
  }

  var frames = el.querySelectorAll('iframe');
  for (var i = 0, frame; frame = frames[i]; i++) {
    this.disableFrame_(frame);
  }
};

/**
 * @private
 * @param {Node} frame
 */
SlideDeck.prototype.disableFrame_ = function(frame) {
  frame.src = 'about:blank';
};

/**
 * @private
 * @param {number} slideNo
 */
SlideDeck.prototype.getSlideEl_ = function(no) {
  if ((no < 0) || (no >= this.slides.length)) {
    return null;
  } else {
    return this.slides[no];
  }
};

/**
 * @private
 * @param {number} slideNo
 * @param {string} className
 */
SlideDeck.prototype.updateSlideClass_ = function(slideNo, className) {
  var el = this.getSlideEl_(slideNo);

  if (!el) {
    return;
  }

  if (className) {
    el.classList.add(className);
  }

  for (var i = 0, slideClass; slideClass = this.SLIDE_CLASSES_[i]; ++i) {
    if (className != slideClass) {
      el.classList.remove(slideClass);
    }
  }
};

/**
 * @private
 */
SlideDeck.prototype.makeBuildLists_ = function () {
  for (var i = this.curSlide_, slide; slide = this.slides[i]; ++i) {
    var items = slide.querySelectorAll('.build > *');
    for (var j = 0, item; item = items[j]; ++j) {
      if (item.classList) {
        item.classList.add('to-build');
        if (item.parentNode.classList.contains('fade')) {
          item.classList.add('fade');
        }
      }
    }
  }
};

/**
 * @private
 * @param {boolean} dontPush
 */
SlideDeck.prototype.updateHash_ = function(dontPush) {
  if (!dontPush) {
    var slideNo = this.curSlide_ + 1;
    var hash = '#' + slideNo;
    if (window.history.pushState) {
      window.history.pushState(this.curSlide_, 'Slide ' + slideNo, hash);
    } else {
      window.location.replace(hash);
    }

    // Record GA hit on this slide.
    window['_gaq'] && window['_gaq'].push(['_trackPageview',
                                          document.location.href]);
  }
};


/**
 * @private
 * @param {string} favIcon
 */
SlideDeck.prototype.addFavIcon_ = function(favIcon) {
  var el = document.createElement('link');
  el.rel = 'icon';
  el.type = 'image/png';
  el.href = favIcon;
  document.querySelector('head').appendChild(el);
};

/**
 * @private
 * @param {string} theme
 */
SlideDeck.prototype.loadTheme_ = function(theme) {
  var styles = [];
  if (theme.constructor.name === 'String') {
    styles.push(theme);
  } else {
    styles = theme;
  }

  for (var i = 0, style; themeUrl = styles[i]; i++) {
    var style = document.createElement('link');
    style.rel = 'stylesheet';
    style.type = 'text/css';
    if (themeUrl.indexOf('http') == -1) {
      style.href = this.CSS_DIR_ + themeUrl + '.css';
    } else {
      style.href = themeUrl;
    }
    document.querySelector('head').appendChild(style);
  }
};

/**
 * @private
 */
SlideDeck.prototype.loadAnalytics_ = function() {
  var _gaq = window['_gaq'] || [];
  _gaq.push(['_setAccount', this.config_.settings.analytics]);
  _gaq.push(['_trackPageview']);

  (function() {
    var ga = document.createElement('script'); ga.type = 'text/javascript'; ga.async = true;
    ga.src = ('https:' == document.location.protocol ? 'https://ssl' : 'http://www') + '.google-analytics.com/ga.js';
    var s = document.getElementsByTagName('script')[0]; s.parentNode.insertBefore(ga, s);
  })();
};


// Polyfill missing APIs (if we need to), then create the slide deck.
// iOS < 5 needs classList, dataset, and window.matchMedia. Modernizr contains
// the last one.
(function() {
  Modernizr.load({
    test: !!document.body.classList && !!document.body.dataset,
    nope: ['js/polyfills/classList.min.js', 'js/polyfills/dataset.min.js'],
    complete: function() {
      window.slidedeck = new SlideDeck();
    }
  });
})();
/**************************************************************************/
/* Functions used on slides */
function $(x) {
	return document.getElementById(x);
}

function setShadow() {
	var h = $('boxShadowH').value;
	var v = $('boxShadowV').value;
	var b = $('boxShadowB').value;
	var s = $('boxShadowS').value;
	var c = $('boxShadowC').value;
	var shadow = h + "px " + v + "px " + b + "px " + s + "px " + c;
	$('boxShadowExampleId').style.webkitBoxShadow = shadow;
}
	
function setTxtShadow() {
	var h = $('txtShadowH').value;
	var v = $('txtShadowV').value;
	var b = $('txtShadowB').value;
	var c = $('txtShadowC').value;
	var shadow = h + "px " + v + "px " + b + "px " + c;
	$('textShadowExampleId').style.textShadow = shadow;
}

function setTxtStroke() {
	var c = $('txtStrokeC').value;
	$('textStrokeExampleId').style.webkitTextStrokeColor = c;
	var w = $('txtStrokeW').value;
    $('textStrokeExampleId').style.webkitTextStrokeWidth = w + "px";
	var f = $('txtFillC').value;
	$('textStrokeExampleId').style.webkitTextFillColor = f;
}

function setClip() {
	var t = $('clipT').value;
	var r = $('clipR').value;
	var b = $('clipB').value;
	var l = $('clipL').value;
	var c = "rect(" + t  +"px, " + r + "px, " + b + "px, " + l + "px)";
	$('clipExampleId').style.clip = c;
}	

function setOpacity(v) {
	v = v/100;
	$('opacityValue').innerHTML = v;
	$('opacityExampleId').style.opacity = v;
}

function setColumn() {
	var cc = $('columnCount').value;
	$('columnCountSpan').innerHTML = cc;
	var cr = $('columnRule').value;
	var crc = $('columnRuleColor').value;
	var cg = $('columnGap').value;
	$('columnGapSpan').innerHTML = cg;
	var ce = $('columnExampleId');
	ce.style.webkitColumnCount = cc;
	ce.style.webkitColumnRule = cr + "px solid " + crc;
	ce.style.webkitColumnGap = cg + "px";
}

function setOverflowWidth(s) {
	$("overflowEllipsisId").style.width = s + "px";
	$("overflowClipId").style.width = s + "px";
}

function changeAudio()
{
	var autoplay = $('audioAutoplay').checked;
	var loop = $('audioLoop').checked;
	var controls = $('audioControls').checked;
	var audioElem = "<audio id='audioPlayer'";
	if (autoplay) {
		audioElem += " autoplay ";
	}
	if (loop) {
		audioElem += " loop ";
	}
	if (controls) {
		audioElem += " controls ";
	}
	audioElem += "><source src='files/friends.mp3' /></audio>"
	$('audioPlayerDiv').innerHTML = audioElem;
}

function doTransform() {
	var tx = $('translateXRangeId').value;
	var ty = $('translateYRangeId').value;
	var cx = $('scaleXRangeId').value;
	var cy = $('scaleYRangeId').value;
	var rx = $('rotateXRangeId').value;
	var ry = $('rotateYRangeId').value;
	var sx = $('skewXRangeId').value;
	var sy = $('skewYRangeId').value;
	cx = Math.round(cx*100)/100;
	cy = Math.round(cy*100)/100;
	
	$('translateXSpanId').innerHTML = tx;
	$('translateYSpanId').innerHTML = ty;
	$('scaleXSpanId').innerHTML = cx;
	$('scaleYSpanId').innerHTML = cy;
	$('rotateXSpanId').innerHTML = rx;
	$('rotateYSpanId').innerHTML = ry;
	$('skewXSpanId').innerHTML = sx;
	$('skewYSpanId').innerHTML = sy;
	
	var trans = "translate(" + tx + "px," + ty + "px) ";
	var scale = "scale(" + cx + "," + cy + ") ";
	var rot = "rotateX(" + rx + "deg) rotateY(" + ry + "deg) ";
	var skew = "skew(" + sx + "deg," + sy + "deg) ";
	
	var transform = trans + scale + rot + skew;
	$('transformationExampleId2').style.webkitTransform = transform;
}
	
function changeLinearGradient() {
   var from = $('lg1ColorF').value;
   var to = $('lg1ColorT').value;
   var lg = "-webkit-linear-gradient(" + from + "," + to + ")";
   $('linearGradientExampleId').style.backgroundImage = lg;
}	

function changeRadialGradient() {
   var from = $('rg1ColorF').value;
   var to = $('rg1ColorT').value;
   var rg = "-webkit-radial-gradient(" + from + "," + to + ")";
   $('radialGradientExampleId').style.backgroundImage = rg;
}	

window.addEventListener('deviceorientation', function(event) {
  var alpha = event.alpha;
  var beta = event.beta;
  var gamma = event.gamma;
  var overThreshold = Math.abs(gamma) > 4 || Math.abs(beta) > 4;
  gamma = overThreshold ? gamma : 0;
  beta = overThreshold ? beta : 0;
  var zindex = 0;
  var layers = document.querySelectorAll('.layer');
  for (var i = 0, elem; elem = layers[i]; ++i) {
    zindex++;
    var x = Math.round(1.5 * gamma * zindex);
    var y = Math.round(1.5 * beta * zindex);
    var style = elem.style;
    style.left = x.toString() + 'px';
    style.top = y.toString() + 'px';
    style.webkitTransform = 'rotateY(' + (-2.0 * gamma) + 'deg) rotateX(' + (-2.0 * beta) + 'deg)';
  }
}, false);


function showLocation(evt) {
   var map = null;
   var geolog = document.getElementById('geolog');
   var geoMap = document.getElementById('geomap');
   if (!map) {
       map = new google.maps.Map(geoMap, {
         zoom: 3,
         center: new google.maps.LatLng(37.4419, -94.1419), // United States
         mapTypeId: google.maps.MapTypeId.ROADMAP
       });
       map.getDiv().style.border =  '1px solid #ccc';
   }

   if (navigator.geolocation) {
      geolog.style.visibility = 'visible';
      geolog.textContent = 'Looking for location...';
	  navigator.geolocation.getCurrentPosition(
		function(position) {
			var acc = position.coords.accuracy;
			var lat1 = position.coords.latitude;
			var log1 = position.coords.longitude;
			lat1 = Math.round(lat1*100)/100;
			log1 = Math.round(log1*100)/100;
			
	     	geolog.textContent = "Latitude: " + lat1 + " , Longitude: " + log1;
	          var latLng = new google.maps.LatLng(
                  position.coords.latitude, position.coords.longitude);
              var marker = new google.maps.Marker({
                position: latLng,
                map: map
              });
              map.setCenter(latLng);
              map.setZoom(15);
            }, 
	     function(evt) { 
		   geolog.textContent = evt.message;
		  }
	  );
	}
}

function manageHistory(event, color) {
	var url = window.location.url + '#' + color; 
	data['color'].url = url
	history.pushState(data[color], color, url);
}

var worker = null;
var cont = true;

function findPrimesWithWorker() {
   worker = new Worker('js/worker.js');
   worker.onmessage = function (event) {
	  document.getElementById('webWorkerResult').textContent = event.data;
    }
   worker.postMessage();
}

function stopPrimesWithWorker() {
	if (worker.terminate) {
		document.getElementById('webWorkerResult').textContent = "Worker Stopped";
		worker.terminate();
    }
}


function findPrimesWithoutWorker() {
	cont = true;
	var n = 1;
	while (true) {
		n++;
		var found = true;
		for (var i = 2; i <= Math.sqrt(n); ++i) {
		   if (cont == false) {
		     document.getElementById("webWorkerResult").textContent = "Task Stopped";	
		   }
		   if (n % i == 0) {
		      found = false;
			   break;
		    }
		 }
		if (found == true) {
	      document.getElementById('webWorkerResult').textContent = n;
		}
	}
}

function stopPrimesWithoutWorker() {
	cont = false;
}

function webSqlExecute1() {
   var db = openDatabase('mydb', '1.0', 'Test DB', 1024);
   if (db) {
	alert("Database created");	
   } else {
	alert("openDatabase failed.");
   }
}

function webSqlExecute2() {
	var db = openDatabase('mydb', '1.0', 'Test DB', 2 * 1024 * 1024);
    db.transaction(function (tx) {tx.executeSql('CREATE TABLE IF NOT EXISTS LOGS (id unique, log)', [], 
       function(tx, result) { alert("Table created"); }, null)});
}

function webSqlExecute3() {
	var db = openDatabase('mydb', '1.0', 'Test DB', 1024);
	db.transaction(function (tx) {
       tx.executeSql('INSERT INTO LOGS (id, log) VALUES (1, "foobar")', [], 
	       function(tx, result) { alert("Row Inserted."); }, null)});
	
}

function webSqlExecute4() {
	var db = openDatabase('mydb', '1.0', 'Test DB', 1024);
	db.transaction(function (tx) {
       tx.executeSql('INSERT INTO LOGS (id, log) VALUES (2, "logmsg")', [], 
	       function(tx, result) { alert("Row Inserted."); }, null)});
	
}

function webSqlExecute5() {
	var db = openDatabase('mydb', '1.0', 'Test DB', 1024);
	db.transaction(function (tx) {
       tx.executeSql('UPDATE LOGS SET log="astast" WHERE id = 1', [], 
	       function(tx, result) { alert("Row Updated."); }, null)});
}

function webSqlExecute6() {
	var db = openDatabase('mydb', '1.0', 'Test DB', 1024);
	db.transaction(function (tx) {
	   tx.executeSql('SELECT * FROM LOGS', [], function (tx, results) {
	   var len = results.rows.length, i;
	   msg = "Found " + len + " rows: [";
	   for (i = 0; i < len; i++){
	      var data = i + "=>" + results.rows.item(i).log;
		  msg += data;
		  if (i < len-1) {
			msg += ", ";
		}
	   }
	   msg += "]";
	   alert(msg);
	 }, null);
	});
}

function webSqlExecute7() {
	var db = openDatabase('mydb', '1.0', 'Test DB', 1024);
	db.transaction(function (tx) {
	   tx.executeSql('DROP TABLE LOGS', [], function(tx, result) { alert("Table dropped.");}, null);
	});
}

function webSocketExecute() {
	var addr = "ws://html5rocks.websocket.org/echo";
    var ws = new WebSocket(addr, ['soap', 'xmpp']);
    ws.onopen = function() { ws.send('Hello Server!'); }
    ws.onmessage = function(event) { alert("Server says: " + event.data);}
}


function animateTitlePart1() {
	document.getElementById("titleT").classList.add("titleTMove1");
	document.getElementById("titleM").classList.add("titleMMove1");
	document.getElementById("titleL").classList.add("titleLMove1");
	document.getElementById("title5").classList.add("title5Move1");
	document.getElementById("titleH2").classList.add("titleH2Move1");
	document.getElementById("titleT2").classList.add("titleH2Move1");
	document.getElementById("titleM2").classList.add("titleH2Move1");
	document.getElementById("titleL2").classList.add("titleH2Move1");
}

function animateTitlePart2() {
	document.getElementById("titleT").classList.add("titleTMove2");
	document.getElementById("titleM").classList.add("titleMMove2");
	document.getElementById("titleL").classList.add("titleLMove2");
	document.getElementById("titleH2").classList.add("titleH2Move2");
	document.getElementById("titleT2").classList.add("titleH2Move2");
	document.getElementById("titleM2").classList.add("titleH2Move2");
	document.getElementById("titleL2").classList.add("titleH2Move2");
}

function animateTitlePart3() {
	 document.getElementById("titleOther5").classList.add("titleOther5Move1");
}


/* The canvas bouncing balls  demo */

var x, y, dx, dy ;
var ctx, WIDTH, HEIGHT;
var paddlex, paddleh, paddlew;
var canvasMinX, canvasMaxX;
var intervalId;
var NROWS, NCOLS;
var bricks, BRICKWIDTH, BRICKHEIGHT;
var PADDING;



function initVariables() {
  x = 25, y = 250, dx = 1.5, dy = -4;
  paddleh = 15, paddlew = 75;
  NROWS = 5, NCOLS = 10;
  BRICKHEIGHT = 20;
  PADDING = 1;
}

function initCanvasDemo() {
  ctx = $('canvas').getContext("2d");
  WIDTH = $("canvas").width;
  HEIGHT = $("canvas").height;
  paddlex = WIDTH / 2 - paddlew/2;
  BRICKWIDTH = (WIDTH/NCOLS) - 1;
  canvasMinX = $("canvas").offsetLeft;
  canvasMaxX = canvasMinX + WIDTH;
  intervalId = setInterval(draw, 10);
}

function circle(x,y,r) {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI*2, true);
  ctx.closePath();
  ctx.fill();
} 

function rect(x,y,w,h) {
  ctx.beginPath();
  ctx.rect(x,y,w,h);
  ctx.closePath();
  ctx.fill(); 
}
 
function clear() {
  ctx.clearRect(0, 0, WIDTH, HEIGHT);
  rect(0,0,WIDTH,HEIGHT);
}

function onMouseMove(evt) {
  var adj = $('canvas').parentNode.parentNode.offsetLeft + $('canvas').offsetLeft;
  var mouseX = event.pageX - adj; 
 
  if (mouseX > canvasMinX && mouseX < canvasMaxX) {
    paddlex = Math.max(mouseX - paddlew/2, 0);
    paddlex = Math.min(WIDTH - paddlew, paddlex);
  }  
 }

document.addEventListener("mousemove", onMouseMove, false);

function initbricks() {
    bricks = new Array(NROWS);
    for (i=0; i < NROWS; i++) {
        bricks[i] = new Array(NCOLS);
        for (j=0; j < NCOLS; j++) {
            bricks[i][j] = 1;
        }
    }
}

function drawbricks() {
  for (i=0; i < NROWS; i++) {
    ctx.fillStyle = rowcolors[i];
    for (j=0; j < NCOLS; j++) {
      if (bricks[i][j] == 1) {
        rect((j * (BRICKWIDTH + PADDING)) + PADDING, 
             (i * (BRICKHEIGHT + PADDING)) + PADDING,
             BRICKWIDTH, BRICKHEIGHT);
      }
    }
  }
}

var ballr = 10;
var rowcolors = ["#FF1C0A", "#FFFD0A", "#00A308", "#0008DB", "#EB0093"];
var paddlecolor = "#FFFFFF";
var ballcolor = "#FFFFFF";
var backcolor = "#000000";

function draw() {
 
  ctx.fillStyle = backcolor;
  clear();
  ctx.fillStyle = ballcolor;
  circle(x, y, ballr);

  ctx.fillStyle = paddlecolor;
  rect(paddlex, HEIGHT-paddleh, paddlew, paddleh);
  drawbricks();

  rowheight = BRICKHEIGHT + PADDING;
  colwidth = BRICKWIDTH + PADDING;
  row = Math.floor(y/rowheight);
  col = Math.floor(x/colwidth);
  //reverse the ball and mark the brick as broken
  if (y < NROWS * rowheight && row >= 0 && col >= 0 && bricks[row][col] == 1) {
    dy = -dy;
    bricks[row][col] = 0;
  }
 
  if (x + dx + ballr > WIDTH || x + dx - ballr < 0)
    dx = -dx;

  if (y + dy - ballr < 0)
    dy = -dy;
  else if (y + dy + ballr > HEIGHT - paddleh) {
    if (x > paddlex && x < paddlex + paddlew) {
      //move the ball differently based on where it hit the paddle
      dx = 8 * ((x-(paddlex+paddlew/2))/paddlew);
      dy = -dy;
    }
    else if (y + dy + ballr > HEIGHT)
      clearInterval(intervalId);
  }
 
  x += dx;
  y += dy;
}

function runCanvasDemo() {
  initVariables();
  initCanvasDemo(); 
  initbricks();
}

runCanvasDemo();

/** Audio Synthesis */

var  header = new Uint8Array([
    0x52,0x49,0x46,0x46, // "RIFF"
    0, 0, 0, 0,          // put total size here
    0x57,0x41,0x56,0x45, // "WAVE"
    0x66,0x6d,0x74,0x20, // "fmt "
    16,0,0,0,            // size of the following
    1, 0,                // PCM format
    1, 0,                // Mono: 1 channel
    0x44,0xAC,0,0,       // 44,100 samples per second
    0x88,0x58,0x01,0,    // byte rate: two bytes per sample
    2, 0,                // aligned on every two bytes
    16, 0,               // 16 bits per sample
    0x64,0x61,0x74,0x61, // "data"
    0, 0, 0, 0           // put number of samples here
]).buffer;  // Note: we just want the ArrayBuffer.

function makeWave(samples) {
  var bb = new WebKitBlobBuilder();
  var dv = new DataView(header);
  dv.setInt32(4, 36 + samples.length, true);
  dv.setInt32(40, samples.length, true);
  bb.append(header);
  bb.append(samples.buffer);
  return bb.getBlob('audio/wav');
}

// Play a note of the specifed frequency and duration
// We've hardcoded 20,000 samples per second
function playNote(frequency, duration) {
  var samplespercycle = 44100 / frequency;
  var samples = new Uint16Array(44100 * duration);
  var da = 2 * Math.PI / samplespercycle;
  for (var i = 0, a = 0; i < samples.length; i++, a += da) {
    samples[i] = Math.floor(Math.sin(a) * 32768);
  }
  var blob = makeWave(samples);
  var url = window.webkitURL.createObjectURL(blob);
  var player = new Audio(url);
  player.play();
  player.addEventListener('ended', function(e) {
    window.webkitURL.revokeObjectURL(url);
  }, false);
  return url;
}


// Assign appropriate frequencies to the keys
function prevNote(x) {
  x = x / Math.pow(2, 1/12);
  return Math.round(x * 1000) /1000;
}
function nextNote(x) {
  x = x * Math.pow(2, 1/12);
  return Math.round(x * 1000) /1000;
}
var keyIds = document.querySelectorAll(".piano > .key");
var freq = 220; // Base 'Sa'
for (var i = 6; i >= 0; --i) {
	freq = prevNote(freq);
	keyIds[i].addEventListener("mousedown", function(freq)  { return function() { playNote(freq,1);}}(freq), false);
}
freq = 220;
for (var i = 7; i < keyIds.length; ++i) {
	keyIds[i].addEventListener("mousedown", function(freq)  { return function() { playNote(freq,1);}}(freq), false);
	freq = nextNote(freq);
}

function runEx3a(obj) {
   $('ex3ryid').innerHTML = obj.value;
   $('ex3demo').style.webkitTransform = "rotateZ(" + obj.value + "deg)";
}

function runEx3b(obj) {
    $('ex3demo').classList.remove('ex3demoanim');
	var id = obj.id + "id";
	$(id).innerHTML = obj.value;
	var x = $("ex3tox").value + "px ";
	var y = $("ex3toy").value + "px ";
	$("ex3demo").style.webkitTransformOrigin = x + y;
	$("ex3origin").style.left = (400 + parseInt($("ex3tox").value)) + "px";
	$("ex3origin").style.top = (430 + parseInt($("ex3toy").value)) + "px";
}

function cameraFilterChange(obj) {
	var id = obj.id;
	var spanid = id + "id";
	document.getElementById(spanid).innerHTML = obj.value/100;
	
	var grayscale = "grayscale(" + $('cgrayscaleid').innerHTML + ") ";
	var sepia = "sepia(" + $('csepiaid').innerHTML + ") ";
	var saturate = "saturate(" + $('csaturateid').innerHTML + ") ";
	var huerotate = "hue-rotate(" + $('chuerotateid').innerHTML + "deg) ";
	var invert = "invert(" + $('cinvertid').innerHTML + ") ";
	var opacity = "opacity(" + $('copacityid').innerHTML + ") ";
	var brightness = "brightness(" + $('cbrightnessid').innerHTML + ") ";
	var contrast = "contrast(" + $('ccontrastid').innerHTML + ") ";
	var blur = "blur(" + $('cblurid').innerHTML + "px) ";
	$('mevideo').style.webkitFilter = grayscale + sepia + saturate + huerotate + invert + opacity + brightness + contrast + blur;
	
	
}

