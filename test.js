var TIMEOUT = 10000;
function jsonp(url) {
  return new Promise(function (resolve, reject){

    var callbackName = 'productcatalogue';
    var timeoutTrigger = window.setTimeout(function(){
      window[callbackName] = Function.prototype;
      reject(new Error('Timeout'));
    }, TIMEOUT);

    window[callbackName] = function(data){
      window.clearTimeout(timeoutTrigger);
      resolve(data);
    };

    var script = document.createElement('script');
    script.type = 'text/javascript';
    script.async = true;
    script.src = url;

    document.getElementsByTagName('head')[0].appendChild(script);

  });
}
jsonp('gift-guide-data.json?productcatalogue=productcatalogue')
.then(console.debug.bind(console, 'success'), console.error.bind(console, 'error'));