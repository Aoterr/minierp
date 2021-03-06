/**
 * EIP移动App工具类
 */
var EIP = (function(window, ddocument, undefined) {

	/*
	 * 定义全局对象
	 */
	var $eip = {};

	/**
	 * 项目配置类
	 */
	$eip.config = {
		mode: 'debug',
		serviceUrl: "http://www.demobar.cn:9988/"
//	serviceUrl: "http://192.168.1.69:9988/"

	};

	// 初始化页面的i18n标签
	$eip.initPagei18n = function() {
		var elements = document.querySelectorAll('i18n');
		for(var i = 0; i < elements.length; i++) {
			var key = elements[i].attributes.getNamedItem('key').value;
			elements[i].innerHTML = eip.get_i18n(key);
		}
	};

	//初始化EIP
	$eip.init = function() {
		eip.data.initSession();
		eip.data.initParameter();
		eip.data.initDataDictionary();
		eip.data.initI18n();
		eip.initPagei18n();
	}

	/**
	 * 兼容 AMD 模块
	 **/
	if(typeof define === 'function' && define.amd) {
		define('eip', [], function() {
			return $eip;
		});
	}

	return $eip;

})(window, document);

window.eip = EIP;
window.aolong = {};
window.aolong.mobile = {};

/**
 * 项目数据类
 * @param {Object} win
 * @param {Object} mui
 */
(function(win, mui) {

	var $eip = win.eip;

	/*获取当前登陆用户*/
	var initSession = function() {
		var session = eip.storage.getItem("session");
		if(session) {
			$eip.session = session;
		} else {
			$eip.session = {};
		}
	};
	//获取全局参数
	var initParameter = function() {
		var parameter = eip.storage.getItem("parameter");
		if(parameter) {
			$eip.parameter = parameter;
		} else {
			$eip.parameter = {};
		}
	};

	//获取数据字典
	var initDataDictionary = function() {
		var dd = eip.storage.getItem("dd");
		if(dd) {
			$eip.dd = dd;
		} else {
			$eip.dd = {};
		}
	}
	//获取国际化
	var initI18n = function() {
		var i18n = eip.storage.getItem("i18n");
		if(i18n) {
			$eip.i18n = i18n;
		} else {
			$eip.i18n = {};
		}
	};

	window.eip.data = {
		initSession: initSession,
		initParameter: initParameter,
		initDataDictionary: initDataDictionary,
		initI18n: initI18n
	}
	
	window.eip.get_i18n = function(key){
		var lowerkey = key.toLowerCase();
		if(eip.i18n.hasOwnProperty(lowerkey)){
			return  eip.i18n[lowerkey]
		}
		return key;
	}
	
}(window, mui));

/**
 * 数据请求服务类
 * @param {Object} win
 * @param {Object} mui
 */
(function(win, mui) {

	var $eip = {};

	var request = {
		defaultSettings: {
			dataType: 'json', //服务器返回json格式数据
			type: 'get', //HTTP请求类型
			timeout: 30000, //超时时间设置为30秒；
			error: function(xhr, type, errorThrown) {
				console.log(type,JSON.stringify(errorThrown));
			}
		}
	}

	$eip.request = {};
	$eip.request.ajaxJsonp = function(url, settings) {
		if(settings) {
			settings.dataType = 'jsonp';
			settings.jsonp = "jsoncallback";
			if(!settings.type) settings.type = request.defaultSettings.type;
			if(!settings.timeout) settings.timeout = request.defaultSettings.timeout;			
			if(!settings.error) settings.error = request.defaultSettings.error;
		} else {
			settings = request.defaultSettings;
		}
		mui.ajax(eip.config.serviceBaseUrl + url + "/?jsoncallback=?", settings);
	}
	$eip.request.ajax = function(options) {
		var settings = options || {}
		if(!settings.dataType) settings.dataType = request.defaultSettings.dataType;
		if(!settings.type) settings.type = request.defaultSettings.type;
		if(!settings.timeout) settings.timeout = request.defaultSettings.timeout;		
		if(!settings.error) settings.error = request.defaultSettings.error;
		mui.ajax(eip.config.serviceUrl + options.url, settings);
	}
	$eip.request.get = function(options) {
		options = options || {}
		$eip.request.ajax({
			url: options.url,
			data: options.data,
			dataType: options.dataType,
			async: (options.async==false)?false:true,
			type: 'get',
			success: options.callback
		});
	}
	$eip.request.post = function(options) {
		options = options || {}
		$eip.request.ajax({
			url: options.url,
			data: options.data,
			dataType: options.dataType,
			async: (options.async==false)?false:true,
			type: 'post',
			success: options.callback
		});
	}
	$eip.request.getJSON = function(options) {
		options = options || {}
		$eip.request.ajax({
			url: options.url,
			data: options.data,
			dataType: 'json',
			async: (options.async==false)?false:true,
			type: 'get',
			success: options.callback
		});
	}

	window.eip.request = $eip.request;

}(window, mui));

/**
 * 基础数据类
 * @param {Object} win
 * @param {Object} mui
 */
(function(win, mui) {

	var $eip = win.eip;

	//初始化加载基础数据：全局参数、数据字典、国际化
	var initBaseData = function(force) {
		var parameter = $eip.storage.getItem("parameter");
		var dd = $eip.storage.getItem("dd");
		var i18n = $eip.storage.getItem("i18n");
		if(force || parameter == "" || dd == "" || i18n == "") {
			$eip.request.get({
				url: "mobile/sys/baseData_Mobile.action",
				callback: function(data) {
					var parameter = data['parameter'];
					var dd = data['dataDictionary'];
					var i18n = data['i18n'];

					eip.storage.setItem("parameter", parameter);
					eip.storage.setItem("dd", dd);
					eip.storage.setItem("i18n", i18n);
				}
			});
		}
	};
	window.eip.initBaseData = initBaseData

}(window, mui));

/**
 * EIP JSONP
 * 实现jsonp, 实现自动判断环境
 * varstion 1.0.0
 */

(function($, win, doc) {

	var callbackIndex = 0;

	//生成回调函数名
	var createCallbackName = function() {
		return 'mui_jsonp_callback_' + (callbackIndex++);
	};

	var container = doc.body;

	//导入 script 元素
	var importScript = function(url) {
		var element = doc.createElement('script');
		element.src = url;
		element.async = true;
		element.defer = true;
		container.appendChild(element);
		return element;
	};

	//转换 URL，JSONP 只支持 get 方式的 queryString ,需将 data 拼入 url
	var convertUrl = function(url, data, jsonpParam, callbacnName) {
		if(jsonpParam) {
			url = url + (url.indexOf('?') > -1 ? '&' : '?') + jsonpParam + '=' + callbacnName;
		} else {
			data['callback'] = callbacnName;
		}
		var buffer = [];
		for(var key in data) {
			buffer.push(key + '=' + encodeURIComponent(data[key]));
		}
		return url + (url.indexOf('?') > -1 ? '&' : '?') + buffer.join('&');
	};

	//获取 QueryString
	var getQueryString = function(url) {
		url = url || location.search;
		var splitIndex = url.indexOf('?');
		var queryString = url.substr(splitIndex + 1);
		var paramArray = queryString.split('&');
		var result = {};
		for(var i in paramArray) {
			var params = paramArray[i].split('=');
			result[params[0]] = params[1];
		}
		return result;
	}

	//获取将传递给服务器的回调函数的请求参数名
	var getJSONPParam = function(url) {
		//		var query = getQueryString(url);
		//		for (var name in query) {
		//			if (query[name] === '?') {
		//				return name;
		//			}
		//		}
		//		return null;
		return '__jsoncallback';
	};

	$.noop = function(rs) {
		alert(rs)
	}

	/**
	 * @description JSONP 方法
	 * @param {String} url  将请求的地址
	 * @param {Object} data 请求参数数据
	 * @param {Function} callback 请求完成时回调函数
	 * @return {mui} mui 对象自身
	 **/
	$.getJSONP = function(options) {
		options = options || {}
		var url = options.url;
		var data = options.data
		var callback = options.callback;
		var url = eip.config.serviceUrl + url;
		if(!url) {
			throw "mui.getJSONP URL error!";
		}
		var jsonpParam = getJSONPParam(url);
		var callbackName = createCallbackName();
		data = data || {};
		callback = callback || $.noop;
		url = convertUrl(url, data, jsonpParam, callbackName);
		var scriptElement = null;
		win[callbackName] = function(result) {
			callback(result);
			if(scriptElement) {
				container.removeChild(scriptElement);
			}
			win[callbackName] = null;
			delete win[callbackName];
		};
		scriptElement = importScript(url);
		return $;
	};

	//为原 mui.getJSON 方法添加同 jQuery.getJSON 一样的 JSONP 支持
	$.__getJSON = $.getJSON;
	$.getJSON = function(options) {
		options = options || {}
		var url = options.url;
		var isMobile = null;
		// 判断runtime是否支持5+ API
		if(navigator.userAgent.indexOf("Html5Plus") < 0) {
			isMobile = false;
		} else {
			isMobile = true;
		}
		if(!isMobile) {
			return $.getJSONP(options);
		} else {
			return $.__getJSON(options);
		}
	};

	//为微信或浏览器wap提供jsonp,解决跨域问题
	$.__get = $.get;
	$.get = function(options) {
		var isMobile = null;
		// 判断runtime是否支持5+ API
		if(navigator.userAgent.indexOf("Html5Plus") < 0) {
			isMobile = false;
		} else {
			isMobile = true;
		}
		if(isMobile) {
			return $.__get(options);
		} else {
			return $.getJSONP(options);
		}
	};

}(eip.request, window, document));

/**
 * 选择器类
 * @param {Object} win
 * @param {Object} mui
 */
(function(win, mui) {

	var select = function(els) {
		if(els && (typeof els === 'string') && els.constructor === String) {
			this._doc = document.querySelectorAll(els);
		} else {
			this._doc = [];
			this._doc.push(els); //非字符串就认为是document
		}
		return this;
	}
	select.fn = select.prototype = {
		/*
		 * 获取Document
		 */
		doc: function() {
			if(this._doc.length == 1) {
				return this._doc[0];
			} else {
				return this._doc;
			}
		},
		append: function(content) {
			for(var i = 0; i < this._doc.length; i++) {
				this._doc[i].innerHTML += content;
			}
			return this;
		},
		addClass: function(cls) {
			for(var i = 0; i < this._doc.length; i++) {
				this._doc[i].classList.add(cls);
			}
			return this;
		},
		hasClass: function(cls) {
			for(var i = 0; i < this._doc.length; i++) {
				return this._doc[i].classList.contains(cls);
			}
		},
		prepend: function() {
			//使用率可能不是很高，没有必要加这个
		},
		remove: function() {
			this._doc.forEach(function(doc, i){
	            doc.parentNode.removeChild(doc);
	       });
			return this;
		},
		attr: function(attr, attrValue) {
			if(attrValue) {
				for(var i = 0; i < this._doc.length; i++) {
					this._doc[i].attributes.getNamedItem(attr).value = attrValue;
				}
				return this;
			} else {
				if(this._doc.length == 1) {
					return this._doc[0].attributes.getNamedItem(attr).value;
				} else {
					var vals = [];
					for(var i = 0; i < this._doc.length; i++) {
						vals.push(this._doc[i].attributes.getNamedItem(attr).value);
					}
					return vals;
				}
			}
		},
		removeAttr: function(attr) {
			for(var i = 0; i < this._doc.length; i++) {
				return this._doc[i].attributes.removeNamedItem(attr);
			}
		},
		removeClass: function(cls) {
			for(var i = 0; i < this._doc.length; i++) {
				this._doc[i].classList.remove(cls);
			}
			return this;
		},
		empty: function() {
			for(var i = 0; i < this._doc.length; i++) {
				this._doc[i].innerHTML = "";
			}
			return this;
		},
		length: function() {
			return this._doc.length;
		},
		val: function(content) {
			if(content) {
				for(var i = 0; i < this._doc.length; i++) {
					this._doc[i].innerHTML = content;
				}
				return this;
			} else {
				if(this._doc.length == 1) {
					return this._doc[0].value;
				} else {
					var vals = [];
					for(var i = 0; i < this._doc.length; i++) {
						vals.push(this._doc[i].vlaue);
					}
					return vals;
				}
			}
		},
		css: function(css, val) {
			var cssStr = css.replace(/-(\w)/g, function($0, $1) {
				return $1.toUpperCase();
			});
			if(val) {
				for(var i = 0; i < this._doc.length; i++) {
					this._doc[i].style[cssStr] = val;
				}
			} else {
				return this.doc().style[cssStr];
			}
		},
		html: function(content) {
			if(content) {
				for(var i = 0; i < this._doc.length; i++) {
					this._doc[i].innerHTML = content;
				}
				return this;
			} else {
				if(this._doc.length == 1) {
					return this._doc[0].innerHTML;
				} else {
					var vals = [];
					for(var i = 0; i < this._doc.length; i++) {
						vals.push(this._doc[i].innerHTML);
					}
					return vals;
				}
			}
		},

		/**
		 * 绑定事件
		 * @param {Object} event
		 * @param {Object} fn
		 */
		on: function(event, fn) {
			for(var i = 0; i < this._doc.length; i++) {
				this._doc[i].addEventListener(event, fn);
			}
			return this;
		}
	}

	win.eip.select = function(els) {
		return new select(els);
	}

}(window, mui));

/**
 * 本地存储 localStorage
 * @param {Object} win
 * @param {Object} mui
 */
(function(win, mui) {

	var myStorage = {};

	myStorage.getItem = function(k) {
		var str = window.localStorage.getItem(k.toString());
		if(str) {
			try {
				return JSON.parse(str)
			} catch(e) {
				return str;
			}
		} else {
			return "";
		}
	};

	myStorage.setItem = function(k, value) {
		if(typeof value === 'object') {
			value = JSON.stringify(value);
		}
		k = k.toString();
		window.localStorage.setItem(k, value);
	};

	myStorage.removeItem = function(k) {
		return window.localStorage.removeItem(k);
	};

	/*
	myStorage.clear = function() {
		window.localStorage.clear();
	};
	*/

	win.eip.storage = myStorage;

}(window, mui));

/**
 * 本地存储 localStorage+ plus.storage 暂时不用
 * @param {Object} win
 * @param {Object} mui
 */
(function(win, mui) {

	var myStorage = {};

	function getItem(k) {

		var jsonStr = window.localStorage.getItem(k.toString());

		return jsonStr ? JSON.parse(jsonStr).data : null;
	};

	function getItemPlus(k) {

		try {
			var jsonStr = plus.storage.getItem(k.toString());
			return jsonStr ? JSON.parse(jsonStr).data : null;
		} catch(e) {
			return null;
		}

	};

	myStorage.getItem = function(k) {

		return getItem(k) || getItemPlus(k);

	};

	myStorage.setItem = function(k, value) {

		value = JSON.stringify({

			data: value

		});

		k = k.toString();

		try {

			window.localStorage.setItem(k, value);

		} catch(e) {

			console.log(e);

			//TODO 超出localstorage容量限制则存到plus.storage中

			//且删除localStorage重复的数据

			removeItem(k);

			plus.storage.setItem(k, value);

		}

	};

	function getLength() {

		return window.localStorage.length;

	};

	myStorage.getLength = getLength;

	function getLengthPlus() {

		return plus.storage.getLength();

	};

	myStorage.getLengthPlus = getLengthPlus;

	function removeItem(k) {

		return window.localStorage.removeItem(k);

	};

	function removeItemPlus(k) {

		return plus.storage.removeItem(k);

	};

	myStorage.removeItem = function(k) {

		window.localStorage.removeItem(k);

		return plus.storage.removeItem(k);

	}

	myStorage.clear = function() {

		window.localStorage.clear();

		return plus.storage.clear();

	};

	function key(index) {

		return window.localStorage.key(index);

	};

	myStorage.key = key;

	function keyPlus(index) {

		return plus.storage.key(index);

	};

	myStorage.keyPlus = keyPlus;

	function getItemByIndex(index) {

		var item = {

			keyname: '',

			keyvalue: ''

		};

		item.keyname = key(index);

		item.keyvalue = getItem(item.keyname);

		return item;

	};

	myStorage.getItemByIndex = getItemByIndex;

	function getItemByIndexPlus(index) {

		var item = {

			keyname: '',

			keyvalue: ''

		};

		item.keyname = keyPlus(index);

		item.keyvalue = getItemPlus(item.keyname);

		return item;

	};

	myStorage.getItemByIndexPlus = getItemByIndexPlus;

	/**

	 * @author liuyf 2015-05-04

	 * @description 获取所有存储对象

	 * @param {Object} key 可选，不传参则返回所有对象，否则返回含有该key的对象

	 */

	myStorage.getItems = function(k) {

		var items = [];

		var numKeys = getLength();

		var numKeysPlus = getLengthPlus();

		var i = 0;

		if(k) {

			for(; i < numKeys; i++) {

				if(key(i).toString().indexOf(k) != -1) {

					items.push(getItemByIndex(i));

				}

			}

			for(i = 0; i < numKeysPlus; i++) {

				if(keyPlus(i).toString().indexOf(k) != -1) {

					items.push(getItemByIndexPlus(i));

				}

			}

		} else {

			for(i = 0; i < numKeys; i++) {

				items.push(getItemByIndex(i));

			}

			for(i = 0; i < numKeysPlus; i++) {

				items.push(getItemByIndexPlus(i));

			}

		}

		return items;

	};

	/**

	 * @description 清除指定前缀的存储对象

	 * @param {Object} keys

	 * @default ["filePathCache_","ajax_cache_"]

	 * @author liuyf 2015-07-21

	 */

	myStorage.removeItemByKeys = function(keys, cb) {

		if(typeof(keys) === "string") {

			keys = [keys];

		}

		var numKeys = getLength();

		var numKeysPlus = getLengthPlus();

		//TODO plus.storage是线性存储的，从后向前删除是可以的 

		//稳妥的方案是将查询到的items，存到临时数组中，再删除  

		var tmpks = [];

		var tk,

			i = numKeys - 1;

		for(; i >= 0; i--) {

			tk = key(i);

			Array.prototype.forEach.call(keys, function(k, index, arr) {

				if(tk.toString().indexOf(k) != -1) {

					tmpks.push(tk);

				}

			});

		}

		tmpks.forEach(function(k) {

			removeItem(k);

		});

		for(i = numKeysPlus - 1; i >= 0; i--) {

			tk = keyPlus(i);

			Array.prototype.forEach.call(keys, function(k, index, arr) {

				if(tk.toString().indexOf(k) != -1) {

					tmpks.push(tk);

				}

			});

		}

		tmpks.forEach(function(k) {

			removeItemPlus(k);

		})

		cb && cb();

	};

	//win.eip.storage = myStorage;

}(window, mui));

/**
 * String 扩展
 */
var extendString = function() {
	String.prototype.trim = function() {
		return this.replace(/(^\s*)|(\s*$)/g, '');
	};
	String.prototype.format = function() {
		var args = arguments;
		var str = this.replace(/{(\d+)}/g, function(match, number) {
			return typeof args[number] != 'undefined' ? args[number] : match;
		});
		return str.replace(/%(\d+)/g, function(match, number) {
			return typeof args[number] != 'undefined' ? args[number] : match;
		});
	};
	String.prototype.formatModel = function(model) {
		var result = this;
		if(typeof model != 'undefined' && model != null) {
			for(var k in model) {
				var re = new RegExp("{" + k + "}", "g");
				result = result.replace(re, model[k] ? model[k] : '');
			}
		} else {
			re = new RegExp("{[a-zA-Z]+}", "g");
			result = result.replace(re, '');
		}
		return result.toString();
	};
}();

/**
 * 工具类
 * @param {Object} win
 * @param {Object} mui
 */
(function(win, mui) {

	/**
	 * 异步获取本地模板内容
	 * @param {Object} url
	 * @param {Object} fn 包含一个参数“模板内容”
	 */
	eip.loadTemplate = function(url, fn) {
			mui.ajax(url, {
				dataType: 'text',
				type: 'get',
				success: fn
			});
		},
		eip.selectUser = function(config) {
			var self = plus.webview.currentWebview();
			eip.openWindow({
				url: '_www/app/home/selectUser.html',
				id: "selectUser.html",
				extras: {
					parentPageId: self.id
				}
			});
			document.addEventListener('backPage', function(event) {
				config.confirm(event.detail);
			});
		}

}(window, mui));

/**
 * 封装mui
 * @param {Object} win
 * @param {Object} mui
 */
(function(win, mui) {

	/**
	 * 封装mui.openWindow
	 * @param {Object} config
	 */
	eip.openWindow = function(config) {
		//TODO 路径、权限等处理
		if(!mui.os.plus) {
			window.localStorage.setItem("$currParams", (config.extras) ? JSON.stringify(config.extras) : "");
		}
		mui.openWindow(config);
	}

	eip.getPageParams = function() {
		if(!mui.os.plus) {
			var params = window.localStorage.getItem("$currParams");
			if(params != '') {
				window.localStorage.setItem("$currParams", "");
				params = JSON.parse(params);
				return params;
			} else {
				return {};
			}
		} else {
			return plus.webview.currentWebview();
		}
	}

	/**
	 * 重写plusReady，为适应微信版本
	 * @param {Object} fn
	 */
	eip.ready = function(fn) {
		if(mui.os.plus) {
			mui.plusReady(fn);
		} else {
			fn();
		}
	}

}(window, mui));

(function(win, eip, mui) {

	var count = 0;

	eip.scanQR = function(callback) {
		if(mui.os.wechat) {
			eip.wxHelp.scanQRCode(callback);
		} else if(mui.os.plus) {
			var callbackName = '__scanQR_' + count++;

			function mycallback(e) {
				callback(e.detail.res)
			}
			win.addEventListener(callbackName, mycallback);
			eip.openWindow({
				url: '_www/app/scan/scan.html',
				id: '__scan.html',
				extras: {
					callback: callbackName
				}
			})
		} else {
			mui.toast('此功能仅支持在app端及微信端使用')
		}
	}

}(window, eip, mui));