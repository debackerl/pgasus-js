// Copyright (c) 2015-2016, Laurent Debacker
// MIT License

(function(exports) {
	exports.WebService = function(baseUrl, username, password) {
		this.baseUrl = baseUrl;
		this.username = username;
		this.password = password;
		this.filter = "f";
		this.sort = "s";
		this.limit = "l";
		
		var ws = this;
		var xhr = typeof(XMLHttpRequest) !== 'undefined' ? XMLHttpRequest : require("xmlhttprequest").XMLHttpRequest;
		
		function load_resource(method, path, parameters, options, querystring, callback) {
			var res;
			var req = new xhr();
			if(options && options.cookie) req.headers['Cookie'] = options.cookie;
			
			if(!callback && Promise) {
				res = new Promise(function(resolve, reject) {
					callback = function(error, result) {
						if(error) reject(error);
						else resolve(result);
					};
				});
			}
			
			if(callback)
				req.onreadystatechange = function() {
					if(req.readyState == 4) {
						if(req.status == 200) {
							callback(null, JSON.parse(req.responseText));
						} else {
							callback({"httpStatus": req.status, "httpStatusText": req.statusText, "description": req.responseText});
						}
					}
				};
			
			var done = {}, url = ws.baseUrl + path.replace(/\/[:*]([\w_]+)/g, function(_, id) {
				done[id] = true;
				var v = parameters[id];
				return "/" + (v ? encodeURIComponent(v) : "");
			}) + ".json";
			
			var qs = querystring(done);
			if(qs.length) url += "?" + qs.join("&");
			
			req.open(method, url, true, ws.username, ws.password);
			
			switch(method) {
			case "POST":
			case "PUT":
				var body = {};
				for(var id in parameters)
					if(Object.prototype.hasOwnProperty.call(parameters, id) && !done[id])
						body[id] = parameters[id];
				
				req.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
				req.send(JSON.stringify(body));
				break;
			default:
				req.send();
				break;
			}
			
			return res;
		}
		
		function omap(f) {
			return {get:f("GET"), put:f("PUT"), post:f("POST"), del:f("DELETE")};
		}
		
		return {
			relation: function(path) {
				var res = omap(function(method) {
					return function(parameters, options, callback) {
						return load_resource(method, path, parameters, options, function() {
							var qs = [];
							if(options && options.filter) qs.push(ws.filter + "=" + options.filter);
							return qs;
						}, callback);
					};
				});
				res.get = function(parameters, options, callback) {
					return load_resource("GET", path, parameters, options, function() {
						var qs = [];
						if(options) {
							if(options.filter) qs.push(ws.filter + "=" + options.filter);
							if(options.sort) qs.push(ws.sort + "=" + options.sort);
							if(typeof(options.limit) === "number") qs.push(ws.limit + "=" + ~~options.limit);
						}
						return qs;
					}, callback);
				};
				res.post = function(parameters, options, callback) {
					return load_resource("POST", path, parameters, options, function() {
						return [];
					}, callback);
				};
				return res;
			},
			procedure: function(path) {
				return omap(function(method) {
					return function(parameters, options, callback) {
						return load_resource(method, path, parameters, options, function(done) {
							var qs = [];
							switch(method) {
							case "GET":
							case "DELETE":
								for(var id in parameters)
									if(Object.prototype.hasOwnProperty.call(parameters, id) && !done[id])
										qs.push(id + "=" + encodeURIComponent(JSON.stringify(parameters[id])));
								break;
							}
							return qs;
						}, callback);
					};
				});
			}
		};
	};
})(typeof exports === 'undefined' ? this['pgasus']={} : exports);
