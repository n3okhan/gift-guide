/*global jQuery, ndm */
(function ($) {

    "use strict";
    $.fn.productcatalogue = function (options) {
        this.each(function () {
            var $container = $(this),
                settings = {
                    'groupCount': 0, // Used to count how many groups (a group being all the items on one screen of the slider) there are for the current product catagory.
                    'currentScreen': 1, // Track which screen we are on for the slider.
                    'groupSize': 6, // The amount of products shown on each screen (-including- the promo ad product tile if used) of the scroller.
                    'sponsoredContent': true, // Is there a promo ad product tile being used, this links to the sponsored product catagory.
                    'adPosition': 4, // Which position in the slider group will the promo ad product tile take up.
                    'desktop': true // Is this desktop or mobile? Set in the init.
                },
                helpers = {},
                setup = {},
                controller = {},
                jsonData = {}, // Used to store the JSON data ajax'd in which contains all of the content for the Product Catalogue.
                state = { // UNUSED.
                    activecontent: 1, // UNUSED.
                    activetile: 1 // UNUSED.
                }; // UNUSED.

                // change default settings on mobile
                if ($('body').hasClass('mobile')) {
                    settings = {
                        'groupSize': 4, // The amount of products shown on each screen (-including- the promo ad product tile if used) of the scroller.
                        'desktop': false, // Is this desktop or mobile? Set in the init.
                        'adPosition': 3 // Which position in the slider group will the promo ad product tile take up.
                    };
                }

            // setup adobe event tracking
            window.mready = window.mready || [];

            if (options) {
                $.extend(settings, options);
            }

            helpers.track = function(action, label, order) {

                if (settings.trackingName !== '') {

                    window.mready.push(function(metrics) {
                        metrics.ev({
                            itm: {
                                container: settings.trackingName,
                                order: order,
                                label: action + ':' + label
                            }
                        });
                    });
                }
            };

            setup.productcatalogue = function () {
                setup.events();
            };

            setup.events = function () {
                $container.find('.start-btn').bind('click', function () { // This is the start button on the intro of the Product Catalogue.
                    $container.trigger('product-catalogue-start');
                });
                $container.bind('product-catalogue-start', function () {
                    controller.start();
                });
                $container.bind('product-catalogue-overlay', function (event, id) {
                    controller.productOverlay(id);
                });
                $container.bind('product-catalogue-close', function (event, id) {
                    controller.close();
                });
            };

            controller.start = function () { // This function gets the JSON file used to populate the product catalog, and handles the initial loading state.
                if ($container.hasClass('closed')) { // We've already loaded everything, the Product Catalogue has been closed. So show everything again without reloading anything.
                    $container.removeClass('closed').addClass('active');
                    $container.find('.intro').addClass('hidden');
                    helpers.track('Start Button', 'Start button pressed', '0');
                } else if (!$container.hasClass('loading')) { // This hasn't been closed, can only be triggered from the intro screen, and it's not already loading, so lets begin the initial load.
                    $container.find('.intro').addClass('loading'); // Add for styling.
                    $container.addClass('loading'); // Add for easy state tracking.
                    $.ajax({
                        'url': settings.contentLink,
                        'dataType': 'jsonp',
                        'jsonpCallback': 'productcatalogue',
                        'success': function (data) {
                            jsonData = data;
                            $container.find('.intro').addClass('hidden').removeClass('loading');
                            $container.addClass('active').removeClass('loading');
                            controller.buildContainer(); // This will set up the framework for the Product Catalogue.
                            controller.buildContent('all'); // This will load the content from all catagories into the Product Catalogue.
                        }
                    });
                    helpers.track('Start Button', 'Start button pressed', '0');
                }
            };

            controller.close = function () { // This function is for closing the product catalogue on mobile.
                $container.removeClass('active').addClass('closed');
                $container.find('.product-overlay').remove();
                $container.find('.intro').removeClass('hidden');
                helpers.track('Back', 'Back button pressed', '0');
            };

            controller.buildContainer = function () { // This function sets up the dom elements that create the framework for the content to be dropped into.
                var $contentContainer = $('<div class="content"><div class="catagory-bar"></div><div class="product-container"></div></div>'),
                    $controls = $('<div class="controls"><div class="left">&lt;</div><div class="right">&gt;</div><div class="counter"><span class="position">0</span> of <span class="total">0</span></div></div>'),
                    $close = $('<div class="close">X</div>'),
                    options = '';
                    // Above sets up variables to contain the dom elements we'll be needing.

                options = '<select name="catagory"><option value="all">View All</option>'; // Open the select element.
                $.each(jsonData.catagories, function (key, val) { // Go through each catagory from the data.
                    options = options + '<option value="' + val + '">' + val + '</option>'; // Add each catagory as an option.
                });

                options = options + '/<select>'; // Close the select option.

                $contentContainer.find('.catagory-bar').append($(options)); // Append the select element as a dom object.
                $contentContainer.find('.catagory-bar select').bind('change', function (event) { // Listen for changes in which option is selected.
                    if ($container.has('.product-overlay')){
                        $container.find('.product-overlay').remove();
                    }
                    controller.buildContent($(this).find('option:selected').attr('value')); // Trigger the buildContent function for the newly selected product catagory.
                    helpers.track('Category change (from drop-down)', 'Catagory changed to: ' + $(this).find('option:selected').attr('value'), '0'); // Track the catagory change on user interaction.
                    $container.find('.controls').show();
                });

                $controls.find('.left').bind('click', function () { // Listen for clicks to the left slider control.
                    if (!$(this).hasClass('disabled')) { // Make sure we haven't turned this control off because there isn't any more content to scroll to in this direction.
                        controller.scrollControls('left'); // Activate the scrollControls function to scroll the content left.
                    }
                });
                $controls.find('.right').bind('click', function () { // Listen for clicks to the right slider control.
                    if (!$(this).hasClass('disabled')) { // Make sure we haven't turned this control off because there isn't any more content to scroll to in this direction.
                        controller.scrollControls('right'); // Activate the scrollControls function to scroll the content right.
                    }
                });
                if (!settings.desktop) { // Check that we aren't on desktop, which means we are on mobile.
                    $close.bind('click', function () { // Listen for clicks to the close button.
                        $container.trigger('product-catalogue-close'); // Triger the close event.
                    });
                    $controls.append($close); // Add the close button to the framework.
                }

                $container.append($contentContainer); // Add framework elements to the page dom.
                $container.append($controls); // Add framework elements to the page dom.
            };

            controller.buildContent = function (catagory) {
                var $content = $('<div class="products"></div>'),
                    productCount = 0,
                    builtProductsCount = 0,
                    builtGroupsCount = 0,
                    ad = (typeof jsonData.ad !== "undefined") ? true : false;

                if (catagory == 'undefined') {
                    catagory = 'all';
                }

                if (catagory === 'all') { // We need to figure out how many product groups are going to be displayed for this catagory.
                    productCount = jsonData.products.length; // We're displaying all products, so just use the length of jsonData.products to figure out how many groups we need.
                } else { // A catagory has been selected, so we'll have to figure out how many products are in that catagory.
                    $.each(jsonData.products, function (key, val) { // Lets loop through all of the products.
                        if (catagory === val.productCatagory) { // Lets check if this product is part of the current catagory.
                            productCount = productCount + 1; // This product is part of the current catagory, so add 1 to the count.
                        }
                    });
                }

                if (ad) {
                    settings.groupCount = Math.ceil(productCount / (settings.groupSize - 1)); // We now know how many products are in this catagory, so we can figure out how many product groups we need. Minus one product so we can fit in an ad.
                } else {
                    settings.groupCount = Math.ceil(productCount / (settings.groupSize)); // We now know how many products are in this catagory, so we can figure out how many product groups we need.
                }

                $content.addClass('groups-' + settings.groupCount);
                for (var i = 0; i < settings.groupCount; i = i + 1) {
                    $content.append($('<div class="product-group group-' + (i + 1) + '"></div>'));
                }

                $.each(jsonData.products, function (key, val) {
                    var $item = $('<div id="product-id' + key + '" class="product-preview"><div class="thumbnail"><img src="' + val.productThumbnail + '"></div><div class="name">' + val.productName + '</div><div class="price">' + val.productPrice + '</div><div class="hovername"><p>' + val.productName + '</p></div></div>');
                    if (catagory === 'all' || catagory === val.productCatagory) {
                        $item.bind('click', function () {
                            $container.trigger('product-catalogue-overlay', [key]);
                            $container.find('.controls').hide();
                        }).hover(function () {
                            $(this).addClass('over');
                        }, function () {
                            $(this).removeClass('over');
                        });
                        if (ad) {
                            $content.find('.group-' + (Math.floor(builtProductsCount / (settings.groupSize - 1)) + 1)).append($item);
                        } else {
                            $content.find('.group-' + (Math.floor(builtProductsCount / settings.groupSize) + 1)).append($item);
                        }
                        builtProductsCount = builtProductsCount + 1;
                    }
                });

                if (ad) {
                    $content.find('.product-group .product-preview:nth-of-type(' + (settings.adPosition - 1) + ')').after($('<div class="product-preview ad"><a href="' + jsonData.ad.adLink + '" target="_blank"><img src="' + jsonData.ad.adImage + '"></a></div>').bind('click', function () {
                        // $container.find('.catagory-bar select').val(jsonData.catagories.sponsored).trigger("change"); // Change the select option to the sponsored catagory, and trigger the change event.
                    }).hover(function () {
                        $(this).addClass('over');
                    }, function () {
                        $(this).removeClass('over');
                    }));
                }

                $container.find('.product-container .products').remove();
                $container.find('.product-container').append($content);
                controller.scrollControls('reset');
            };

            controller.productOverlay = function (id) {
                var product = jsonData.products[id], i,
                    $overlay = '',
                    fbLink = 'https://www.facebook.com/dialog/feed?app_id=113758722003364&display=popup&link=' + encodeURIComponent(product.productShare.facebook.url) + '&picture=' + encodeURIComponent(product.productShare.facebook.image) + '&name=' + encodeURIComponent(product.productShare.facebook.title) + '&caption=' + encodeURIComponent(product.productShare.facebook.summary) + '&description=' + encodeURIComponent(product.productShare.facebook.description) + '&redirect_uri=' + encodeURIComponent(/*product.productShare.facebook.urlRedirect*/'http://resources.news.com.au/cs/newscomau/popup-close.html'),
                    twLink = 'https://twitter.com/intent/tweet?text=' + encodeURIComponent(product.productShare.twitter.text) + '&url=' + encodeURIComponent(product.productShare.twitter.url);

                if (settings.desktop) {
                    $overlay = $('<div class="product-overlay"><div class="close button">close</div><div class="image-block"><div class="main-image"></div><div class="thumbnail-block"></div></div><div class="content-block"><div class="name">' + product.productName + '</div><div class="brand-and-price"><div class="brand">' + product.productBrand + '</div><div class="price">' + product.productPrice + '</div></div><div class="social"><div class="facebook"><a class="facebook" href="' + fbLink + '" target="_blank">Facebook</a></div><div class="twitter"><a class="twitter" href="' + twLink + '" target="_blank">Twitter</a></div></div><div class="description"><p>' + product.productDescription + '</p></div><div class="link"><a href="' + product.productLink + '" target="_blank">Buy Now</a></div></div></div>');

                    if (jsonData.products[id].productImages.length > 1) {
                        $overlay.find('.main-image').append($('<img src="' + product.productImages[0] + '"><div class="enlarge-image"><span>Enlarge</span></div><div class="shrink-image">Close</div>'));
                        for (i = 0; i < jsonData.products[id].productImages.length; i = i + 1) {
                            var activeClass = (i === 0) ? ' active' : '';
                            $overlay.find('.thumbnail-block').append($('<div class="thumbnail-wrapper img-' + i + activeClass + '"><img src="' + product.productImages[i] + '"></div>'));
                        }
                    } else if (jsonData.products[id].productImages.length === 1) {
                        $overlay.find('.main-image').append($('<img src="' + product.productImages[0] + '"><div class="enlarge-image"><span>Enlarge</span></div><div class="shrink-image">Close</div>'));
                        $overlay.find('image-block').addClass('single-image');
                    } else {
                        $overlay.find('image-block').addClass('no-images');
                    }

                    $overlay.find('.enlarge-image').bind('click', function () {
                        $overlay.addClass('expanded-image');
                    });
                    $overlay.find('.shrink-image').bind('click', function () {
                        $overlay.removeClass('expanded-image');
                    });
                    $overlay.find('.thumbnail-wrapper').each(function (key, val) {
                        var $this = $(this);
                        $this.bind('click', function () {
                            $overlay.find('.main-image img').attr('src', product.productImages[key]);
                            $overlay.find('.thumbnail-wrapper.active').removeClass('active');
                            $this.addClass('active');
                        });
                    });
                } else {
                    $overlay = $('<div class="product-overlay"><div class="close button">close</div><div class="content-block"><div class="name">' + product.productName + '</div><div class="brand-and-price"><div class="brand">' + product.productBrand + '</div><div class="price">' + product.productPrice + '</div></div><div class="social"><div class="facebook"><a class="facebook" href="' + fbLink + '" target="_blank">Facebook</a></div><div class="twitter"><a class="twitter" href="' + twLink + '" target="_blank">Twitter</a></div></div><div class="description"><p>' + product.productDescription + '</p></div><div class="link"><a href="' + product.productLink + '" target="_blank">Shop Now</a></div></div><div class="image-block"><div class="main-image"></div><div class="thumbnail-block"></div></div></div>');

                    if (jsonData.products[id].productImages.length > 1) {
                        $overlay.find('.main-image').append($('<img src="' + product.productImages[0] + '"><div class="enlarge-image"><span>Enlarge</span></div><div class="shrink-image">Close</div>'));
                        for (i = 0; i < jsonData.products[id].productImages.length; i = i + 1) {
                            $overlay.find('.thumbnail-block').append($('<div class="thumbnail-wrapper img-' + i + '"><img src="' + product.productImages[i] + '"></div>'));
                        }
                    } else if (jsonData.products[id].productImages.length === 1) {
                        $overlay.find('.main-image').append($('<img src="' + product.productImages[0] + '"><div class="enlarge-image"><span>Enlarge</span></div><div class="shrink-image">Close</div>'));
                        $overlay.find('.image-block').addClass('single-image');
                        $overlay.find('.thumbnail-block').append($('<div class="thumbnail-wrapper img-0"><img src="' + product.productImages[0] + '"></div>'));
                    } else {
                        $overlay.find('image-block').addClass('no-images');
                    }

                    $overlay.find('.thumbnail-wrapper').bind('click', function () {
                        $overlay.addClass('expanded-image');
                    });
                    $overlay.find('.shrink-image').bind('click', function () {
                        $overlay.removeClass('expanded-image');
                        $overlay.find('.thumbnail-wrapper.active').removeClass('active');
                    });

                    $overlay.find('.thumbnail-wrapper').each(function (key, val) {
                        var $this = $(this);
                        $this.bind('click', function () {
                            $overlay.find('.main-image img').attr('src', product.productImages[key]);
                            $overlay.find('.thumbnail-wrapper.active').removeClass('active');
                            $this.addClass('active');
                        });
                    });
                }
                $overlay.find('.close').bind('click', function () {
                    $overlay.remove();
                    $container.find('.controls').show();
                });
                $overlay.find('a.facebook').bind('click', function () {
                    helpers.track('Social Share', 'Facebook share button clicked for: ' + product.productName + product.productName, '0');
                });
                $overlay.find('a.twitter').bind('click', function () {
                    helpers.track('Social Share', 'Twitter share button clicked for: ' + product.productName, '0');
                });
                $overlay.find('.link a').bind('click', function () {
                    helpers.track('Buy/Shop Now link clicked', 'Buy/Shop Now link clicked for: ' + product.productName, '0');
                });
                $container.append($overlay);
                helpers.track('Product Tile Clicked', 'Product tile clicked for: ' + product.productName, '0');
            };

            controller.scrollControls = function (type) {
                if (type === 'reset') {
                    settings.currentScreen = 1;
                    if (settings.groupCount === 1) {
                        $container.find('.controls .left, .controls .right').removeClass('disabled').addClass('hidden');
                    } else {
                        $container.find('.controls .left').addClass('disabled').removeClass('hidden');
                        $container.find('.controls .right').removeClass('disabled').removeClass('hidden');
                    }
                    helpers.track('Reset', 'Reset button pressed', '0');
                } else if (type === 'left') {
                    if (settings.currentScreen <= 1) {
                        return;
                    }
                    settings.currentScreen = settings.currentScreen - 1;
                    $container.find('.products').css({'left': '-' + (100 * (settings.currentScreen - 1)) + '%'});
                    $container.find('.controls .right').removeClass('disabled');
                    if (settings.currentScreen <= 1) {
                        $container.find('.controls .left').addClass('disabled');
                    }
                    helpers.track('Previous', 'Previous button pressed', '0');
                } else if (type === 'right') {
                    if (settings.currentScreen >= settings.groupCount) {
                        return;
                    }
                    settings.currentScreen = settings.currentScreen + 1;
                    $container.find('.products').css({'left': '-' + (100 * (settings.currentScreen - 1)) + '%'});
                    $container.find('.controls .left').removeClass('disabled');
                    if (settings.currentScreen >= settings.groupCount) {
                        $container.find('.controls .right').addClass('disabled');
                    }
                    helpers.track('Next', 'Next button pressed', '0');
                }
                $container.find('.controls .counter .position').text(settings.currentScreen);
                $container.find('.controls .counter .total').text(settings.groupCount);
            };

            setup.productcatalogue();

        });
        return this;
    };
}(jQuery));