// Copyright (c) 2015-2016, Laurent Debacker
// MIT License

(function(exports) {
	exports.WebService = function(baseUrl, username, password, options) {
		this.baseUrl = baseUrl;
		this.username = username;
		this.password = password;
		this.options = options;
		this.filter = "f";
		this.sort = "s";
		this.limit = "l";
		
		var mockState = options ? options.mockStateCreator() : null;
		var methodsMapping = {
			"GET": "get",
			"POST": "post",
			"PUT": "put",
			"DELETE": "del"
		};

		var ws = this;
		var xhr = typeof(XMLHttpRequest) !== 'undefined' ? XMLHttpRequest : require("xmlhttprequest-light").XMLHttpRequest;
		
		function load_resource(method, path, parameters, options, mock, querystring, callback) {
			var mockedResource;
			if(baseUrl === null && mock && (mockedResource = mock[methodsMapping[method]])) {
				return mockedResource(parameters, mockState);
			}

			var res;
			var req = new xhr();
			if(ws.options && ws.options.withCredentials)
				req.withCredentials = true;
			if(options && options.cookie) // Node.js only
				req.headers['Cookie'] = options.cookie;
			
			if(!callback && typeof(Promise) !== 'undefined')
				res = new Promise(function(resolve, reject) {
					callback = function(error, result) {
						if(error) reject(error);
						else resolve(result);
					};
				});
			else
				res = {};
			
			res.abort = function(reason) {
				if(req.readyState !== 4) {
					req.abort();
					if(callback) callback({"httpStatus": null, "httpStatusText": null, "message": reason, aborted: true});
				}
			};
			
			if(callback)
				req.onreadystatechange = function() {
					if(req.readyState === 4) {
						var err = null, result = null;

						if(req.status === 200) {
							try {
								result = JSON.parse(req.responseText);
							} catch(e) {
								err = e;
							}
						} else {
							err = {"httpStatus": req.status, "httpStatusText": req.statusText, "message": req.responseText};
						}

						callback(err, result);
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
			relation: function(path, mock) {
				var res = omap(function(method) {
					return function(parameters, options, callback) {
						return load_resource(method, path, parameters, options, mock, function() {
							var qs = [];
							if(options && options.filter) qs.push(ws.filter + "=" + options.filter);
							return qs;
						}, callback);
					};
				});
				res.get = function(parameters, options, callback) {
					return load_resource("GET", path, parameters, options, mock, function() {
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
					return load_resource("POST", path, parameters, options, mock, function() {
						return [];
					}, callback);
				};
				return res;
			},
			procedure: function(path, mock) {
				return omap(function(method) {
					return function(parameters, options, callback) {
						return load_resource(method, path, parameters, options, mock, function(done) {
							var qs = [];
							switch(method) {
							case "GET":
							case "DELETE":
								for(var id in parameters) {
									var v = parameters[id];
									if(Object.prototype.hasOwnProperty.call(parameters, id) && !done[id] && typeof(v) !== 'undefined')
										qs.push(id + "=" + encodeURIComponent(JSON.stringify(v)));
								}
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
