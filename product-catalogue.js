var giftGuideCatalogue = function (jsonPUrl, trackingCode) {

    'use strict';

    var //jsonPUrl = 'gift-guide-data.json', // json file link
        controller = {},
        helpers = {},
        // setup = {},
        settings = {
            'groupCount': 0, // Used to count how many groups (a group being all the items on one screen of the slider) there are for the current product catagory.
            'currentScreen': 1, // Track which screen we are on for the slider.
            'groupSize': 6, // The amount of products shown on each screen (-including- the promo ad product tile if used) of the scroller.
            'sponsoredContent': true, // Is there a promo ad product tile being used, this links to the sponsored product catagory.
            'adPosition': 4, // Which position in the slider group will the promo ad product tile take up.
            'desktop': true, // Is this desktop or mobile? Set in the init.
            'result': false, // initiating json result
            'container': getElementByClass('.product-catalogue.product-catalogue-fox'),
            'trackCode': trackingCode,
            'jsonData': jsonPUrl
        },
        contentContainer = '<div class="content"><div class="catagory-bar"></div><div class="product-container"></div></div>',
        controls = '<div class="controls"><div class="left">&lt;</div><div class="right">&gt;</div><div class="counter"><span class="position">0</span> of <span class="total">0</span></div></div>',
        close = '<div class="close">X</div>';

    // setup adobe event tracking
    // window.mready = window.mready || [];

    //
    // change default settings on mobile
    //
    if (getElementByClass('body').classList.contains('mobile')) {
        console.log('mobile view active');
        Object.defineProperties(settings, {
            groupSize: { // The amount of products shown on each screen (-including- the promo ad product tile if used) of the scroller.
                value: 4,
                writable: true
            },
            desktop: { // Is this desktop or mobile? Set in the init.
                value: false,
                writable: true
            },
            adPosition: { // Which position in the slider group will the promo ad product tile take up.
                value: 3,
                writable: true
            }
        });
    }
    // function return DOM object
    function getElementByClass(className, parentSelector) {
        //console.log(parentSelector);
        if (parentSelector === undefined) {
            return document.querySelector(className);
        } else {
            return parentSelector.querySelector(className);
        }
    } // returns DOM element by class

    console.info('loading the JSONP file');
    // console.log(settings.jsonData)

    var loadJsonP = function (url) {
        var scr = document.createElement('script'); // creating a script tag
        scr.setAttribute('src', url); // adding src link to script tag
        scr.setAttribute('onerror', function (e) {
            console.log(e);
        });
        document.documentElement.firstElementChild.appendChild(scr); // injecting json into header
    };

    var jsonAsync = function () {
        console.info('building the promise');
        return new Promise(function (resolve, reject) {
            console.info("in 'new Promise'");
            window.productcatalogue = resolve;
        });
    };

    /*
     * start product catalouge
     */
    controller.start = function () {
        if (settings.container.classList.contains('closed')) { // We've already loaded everything, the Product Catalogue has been closed. So show everything again without reloading anything.
            settings.container.classList.add('active');
            settings.container.classList.remove('closed');
            getElementByClass('.intro').classList.add('hidden');
            getElementByClass('.product-catalogue.product-catalogue-fox').classList.add('active');
            helpers.track('Start Button', 'Start button pressed', '0');
        } else if (!settings.container.classList.contains('loading')) { // This hasn't been closed, can only be triggered from the intro screen, and it's not already loading, so lets begin the initial load.
            getElementByClass('.intro').classList.add('loading');
            settings.container.classList.add('loading');

            // Json has to load here......... note REVISIT
            // console.info('loading the JSONP file');
            // loadJsonP(jsonPUrl);
        }
        getElementByClass('div.start-btn').onclick = function () {
            settings.container.innerHTML += contentContainer + controls + close; // adding catagory bar, controls, counter, and close button
            controller.buildCatagories();
            controller.buildContainer('undefined');
            controller.bindCtrls();
            getElementByClass('.intro').classList.add('hidden');
            getElementByClass('.product-catalogue.product-catalogue-fox').classList.add('active');
        };
    };

    /*
     * closing product catalouge
     */
    controller.close = function () { // This function is for closing the product catalogue.
        settings.container.classList.remove('active');
        settings.container.classList.add('closed');
        getElementByClass('.close.button').parentNode.removeChild(getElementByClass('.close.button'));
        settings.container.removeChild(getElementByClass('.product-overlay'));
    };

    /**
     * Adding catagory dropdown
     **/
    controller.buildCatagories = function () {
        var selectList = document.createElement('select'), // creating catagory dropdown
            optionAll = document.createElement('option'); // catagory list options
        optionAll.value = 'all';
        optionAll.text = 'View All';
        selectList.appendChild(optionAll);

        var headerSelector = getElementByClass('.catagory-bar'); // inject dropdown;
        selectList.setAttribute('id', 'catagory');
        selectList.setAttribute('name', 'catagory');
        // selectList.insertBefore()
        headerSelector.appendChild(selectList);
        var catagories = settings.result.catagories;
        var catagory;

        for (catagory in catagories) {
            var option = document.createElement('option');
            option.value = settings.result.catagories[catagory];
            option.text = settings.result.catagories[catagory];
            selectList.appendChild(option);
        }
        // console.log(typeof(getElementByClass('select')), 'select element selector');
        getElementByClass('select').onchange = function () {
            if (getElementByClass('.product-overlay')) { //classList.contains
                controller.close();
            }
            controller.buildContainer(this.value);

        };
    };



    /**
     * Adding product catalogue
     **/

    controller.buildContainer = function (catagory) {
        var content = '<div class="products"></div>',
            productCount = 0,
            builtProductsCount = 0,
            builtGroupsCount = 0,
            productId = 0,
            options = '',
            productItem = function (index) {
                return getElementByClass('#product-id' + index);
            },
            products = settings.result.products,
            product,
            currentGroup = 1,
            productList; //= document.createElement('div');

        /**
         * 
         * products click event handler returning function with product ID
         */
        var clickEventHandler = function (index) {
            productItem(index).classList.remove('over');
            // alert('you clicked slider controler ' +index + '!');
            return function () {
                // console.log(divID);
                settings.container.querySelector('.controls').style.display = 'none';
                controller.productOverlay(index);
            };
        };

        if (catagory === 'undefined') {
            catagory = 'all';
        }

        getElementByClass('.product-container').innerHTML = content;


        /** 
        // inserting products
        **/

        for (product in products) {
            console.log(products[product].productCatagory, catagory);
            if (catagory === 'all' || products[product].productCatagory === catagory) {
                if (builtProductsCount === 0) {
                    productList = document.createElement('div');
                    productList.setAttribute('class', 'product-group group-' + currentGroup + '');
                }

                var productListItem = document.createElement('div'); // individual main container
                productListItem.setAttribute('id', 'product-id' + product);
                productListItem.setAttribute('class', 'product-preview');

                var productThumbnailContainer = document.createElement('div'); // product image container
                productThumbnailContainer.setAttribute('class', 'thumbnail');

                var productImage = document.createElement('img'); // product image
                productImage.setAttribute('src', products[product].productThumbnail);
                productThumbnailContainer.appendChild(productImage);

                var productName = document.createElement('div'); // product name
                productName.setAttribute('class', 'name');
                productName.appendChild(document.createTextNode(products[product].productName));

                var productPrice = document.createElement('div'); // product price
                productPrice.setAttribute('class', 'price');
                productPrice.appendChild(document.createTextNode(products[product].productPrice));

                var productHoverName = document.createElement('div'); // product hovername
                productHoverName.setAttribute('class', 'hovername');

                var productHoverNameP = document.createElement('p'); // product hovername para
                productHoverNameP.appendChild(document.createTextNode(products[product].productName));


                productHoverName.appendChild(productHoverNameP);
                productListItem.appendChild(productThumbnailContainer);
                productListItem.appendChild(productName);
                productListItem.appendChild(productPrice);
                productListItem.appendChild(productHoverName);
                productList.appendChild(productListItem);
                builtProductsCount++;
                productCount++;
                if (builtProductsCount === 6 && settings.desktop) {
                    getElementByClass('.products').appendChild(productList);
                    builtProductsCount = 0;
                    currentGroup++;
                }
                if (builtProductsCount === 4 && (settings.desktop === false)) {
                    getElementByClass('.products').appendChild(productList);
                    builtProductsCount = 0;
                    currentGroup++;
                }



            }
            // console.log(product, ' != ', (products.length - 1));
            if (Math.floor(productCount % settings.groupSize) !== 0) {
                getElementByClass('.products').appendChild(productList);
            }
        }
        // console.log(productCount, '/' , settings.groupSize, ' = ', typeof (), 'products remaining to gets add to DOM');
        console.log('Total ' + productCount + ' number of products found in ' + catagory + ' catagory');



        //
        // binding to each product's click event after updating DOM
        //  

        for (var index = 0; index < products.length; index++) {
            if (products[index].productCatagory === catagory || catagory === 'all') {
                console.log(index, 'index inside');
                console.log(products[index].productCatagory, 'product catagory');
                console.log(productItem(index), 'html selector inside catagory');
                productItem(index).onmouseover = function () { // adding mouse over event
                    this.classList.add('over');
                };
                productItem(index).onmouseleave = function () {
                    this.classList.remove('over');
                };
                productItem(index).onclick = clickEventHandler(index);
            }
        }
        controller.scrollControls('reset');
        console.log(productCount, settings.groupSize);
        controller.groupActivity(productCount);
    };

    /**
     * 
     * calculating group of products
     */
    controller.groupActivity = function (productCount) {
        settings.groupCount = Math.ceil(productCount / (settings.groupSize)); // We now know how many products are in this catagory, so we can figure out how many product groups we need. Minus one product so we can fit in an ad.
        // console.log(productCount, 'product count inside group activity');
        // console.log(settings.groupCount, 'group count inside group activity');
        getElementByClass('.products').classList.add('groups-' + settings.groupCount); // adding total group count to the parent div
        getElementByClass('.controls .counter .total').innerHTML = settings.groupCount; // updating group count to the bottom
    };

    /**
     * 
     * creating product overlays
     */
    controller.productOverlay = function (e) {
        // console.log(e)
        var product = settings.result.products,
            overlay = false,
            fbLink = 'https://www.facebook.com/sharer/sharer.php?u=' + encodeURIComponent(product[e].productShare.facebook.url),
            twLink = 'https://twitter.com/intent/tweet?text=' + encodeURIComponent(product[e].productShare.twitter.text) + '&url=' + encodeURIComponent(product[e].productShare.twitter.url),
            showExpendedImg = 'expanded-image',
            enlargeImageContainer = getElementByClass('.main-image'),
            DetailViewLayout = function (overlay) {
                settings.container.querySelector('.close').insertAdjacentHTML('afterend', overlay);
                this.productDetailViewSelector = getElementByClass('.product-overlay');
                this.imageBlock = getElementByClass('.main-image');
                this.thumbnailBlock = getElementByClass('.thumbnail-block');
                this.enlargeImgBtn = getElementByClass('.enlarge-image');
                this.hideEnlargeImgBtn = getElementByClass('.shrink-image');
            },
            desktopView = {},
            mobileView = {};



        if (settings.desktop) {
            overlay = '<div class="product-overlay"><div class="close button">close</div><div class="image-block"><div class="main-image"></div><div class="thumbnail-block"></div></div><div class="content-block"><div class="name">' + product[e].productName + '</div><div class="brand-and-price"><div class="brand">' + product[e].productBrand + '</div><div class="price">' + product[e].productPrice + '</div></div><div class="social"><div class="facebook"><a class="facebook" href="' + fbLink + '" target="_blank">Facebook</a></div><div class="twitter"><a class="twitter" href="' + twLink + '" target="_blank">Twitter</a></div></div><div class="description"><p>' + product[e].productDescription + '</p></div><div class="link"><a href="' + product[e].productLink + '" target="_blank">Buy Now</a></div></div></div>';
            desktopView = new DetailViewLayout(overlay);

            // console.log(overlay);
            // console.log(settings.container);


            if (product[e].productImages.length > 1) {
                enlargeImageContainer.innerHTML = '<img src="' + product[e].productImages[0] + '"><div class="enlarge-image"><span>Enlarge</span></div><div class="shrink-image">Close</div>';
                for (i = 0; i < products[e].productImages.length; i = i + 1) {
                    var activeClass = (i === 0) ? ' active' : '';
                    desktopView.thumbnailBlock.innerHTML += '<div class="thumbnail-wrapper img-' + i + activeClass + '"><img src="' + product.productImages[i] + '"></div>';
                }
            } else if (product[e].productImages.length === 1) {
                desktopView.imageBlock.innerHTML += '<img src="' + product[e].productImages[0] + '"><div class="enlarge-image"><span>Enlarge</span></div><div class="shrink-image">Close</div>';
                // console.log(getElementByClass('.image-block'));
                desktopView.imageBlock.classList.add('single-image');
            } else {
                desktopView.imageBlock.classList.add('no-images');
            }
            // console.log(desktopView.productDetailViewSelector);

            desktopView.enlargeImgBtn = getElementByClass('.enlarge-image');
            desktopView.hideEnlargeImgBtn = getElementByClass('.shrink-image');

            desktopView.enlargeImgBtn.onclick = function () {
                // console.log(productDetailViewSelector, '    console.log(productDetailViewSelector);');
                desktopView.productDetailViewSelector.classList.add(showExpendedImg);
            };
            desktopView.hideEnlargeImgBtn.onclick = function () {
                // console.log(productDetailViewSelector.classList);
                desktopView.productDetailViewSelector.classList.remove(showExpendedImg);
            };

        } else {
            overlay = '<div class="product-overlay"><div class="close button">close</div><div class="content-block"><div class="name">' + product[e].productName + '</div><div class="brand-and-price"><div class="brand">' + product[e].productBrand + '</div><div class="price">' + product[e].productPrice + '</div></div><div class="social"><div class="facebook"><a class="facebook" href="' + fbLink + '" target="_blank">Facebook</a></div><div class="twitter"><a class="twitter" href="' + twLink + '" target="_blank">Twitter</a></div></div><div class="description"><p>' + product[e].productDescription + '</p></div><div class="link"><a href="' + product[e].productLink + '" target="_blank">Shop Now</a></div></div><div class="image-block"><div class="main-image"></div><div class="thumbnail-block"></div></div></div>';
            mobileView = new DetailViewLayout(overlay);

            if (product[e].productImages.length > 1) {
                getElementByClass('.main-image').innerHTML = '<img src="' + product[e].productImages[0] + '"><div class="enlarge-image"><span>Enlarge</span></div><div class="shrink-image">Close</div>';
                for (i = 0; i < products[e].productImages.length; i = i + 1) {
                    mobileView.thumbnailBlock.innerHTML += '<div class="thumbnail-wrapper img-' + i + '"><img src="' + product.productImages[i] + '"></div>';
                }
            } else if (product[e].productImages.length === 1) {
                mobileView.imageBlock.innerHTML += '<img src="' + product[e].productImages[0] + '"><div class="enlarge-image"><span>Enlarge</span></div><div class="shrink-image">Close</div>';
                mobileView.thumbnailBlock.classList.add('single-image');
                mobileView.thumbnailBlock.innerHTML += '<div class="thumbnail-wrapper img-0"><img src="' + product[e].productImages[0] + '"></div>';
            } else {
                mobileView.thumbnailBlock.classList.add('no-images');
            }
            getElementByClass('.thumbnail-wrapper').onclick = function () {
                mobileView.productDetailViewSelector.classList.add(showExpendedImg);
            };
            getElementByClass('.shrink-image').onclick = function () {
                mobileView.productDetailViewSelector.classList.remove(showExpendedImg);
            };
        }
        getElementByClass('.close.button').onclick = function () {
            controller.close();
            getElementByClass('.controls').style.display = '';
        };
    };
    /**
     * setting up left and right eventlistener
     */
    controller.bindCtrls = function () {
        getElementByClass('.left').onclick = function () {
            controller.scrollControls('left');

        };
        getElementByClass('.right').onclick = function () {
            controller.scrollControls('right');

        };
    };

    /**
     * 
     * controlling left and right slider scroll
     */
    controller.scrollControls = function (type) {
        var leftAndRightArrows = settings.container.querySelectorAll('.controls .left, .controls .right');
        switch (type) {
            case 'left':
                if (settings.currentScreen <= 1) {
                    return;
                }
                settings.currentScreen = settings.currentScreen - 1;
                getElementByClass('.products').style.left = '-' + (100 * (settings.currentScreen - 1)) + '%';
                leftAndRightArrows[1].classList.remove('disabled'); // right arrow
                if (settings.currentScreen <= 1) {
                    leftAndRightArrows[0].classList.add('disabled'); // left arrow
                }
                // helpers.track('Previous', 'Previous button pressed', '0');
                // console.log('left clicked');
                break;

            case 'right':
                if (settings.currentScreen >= settings.groupCount) {
                    return;
                }
                settings.currentScreen = settings.currentScreen + 1;
                getElementByClass('.products').style.left = '-' + (100 * (settings.currentScreen - 1)) + '%';
                leftAndRightArrows[0].classList.remove('disabled');
                if (settings.currentScreen >= settings.groupCount) {
                    leftAndRightArrows[1].classList.add('disabled');
                }
                // helpers.track('Next', 'Next button pressed', '0');
                // console.log('right clicked');
                break;

            default:
                settings.currentScreen = 1;
                if (settings.groupCount === 1) {
                    leftAndRightArrows[0].classList.remove('disabled'); // left arrow 
                    leftAndRightArrows[1].classList.remove('disabled'); // right arrow 
                } else {
                    leftAndRightArrows[0].classList.add('disabled'); // left arrow 
                    leftAndRightArrows[0].classList.remove('hidden'); // left arrow 
                    leftAndRightArrows[1].classList.remove('disabled'); // right arrow
                    leftAndRightArrows[1].classList.remove('hidden'); // right arrow
                }
                // helpers.track('reset', 'Reset button pressed', '0');
                // console.log('scroll reset');
        }
        settings.container.querySelector('.controls .counter .position').textContent = settings.currentScreen;
        settings.container.querySelector('.controls .counter .total').textContent = settings.groupCount;
    };

    loadJsonP(settings.jsonData);

    jsonAsync().then(function (result) {
        console.info('in resolve', result);
        controller.start();
        getElementByClass('.intro').classList.remove('loading');
        settings.container.classList.remove('loading');
        settings.container.classList.add('active');
        // console.log(typeof (result));
        // console.log(result);
        settings.result = result;
    });
};