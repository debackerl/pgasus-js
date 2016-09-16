To access pgasus-backed web service, create a new `WebService` object.

`var ws = new WebService(baseUrl, [username], [password]);`

`username` and `password` are optional parameters, to be specified if HTTP basic authentication is needed.

`WebService` objects have two methods:
* `relation(path)` when the resource is a relation (table or view).
* `procedure(path)` when the resource is a procedure (function).

Objects returned by `relation` have four methods:
* `get(parameters, options, callback)`
 * `options`: `filter` (use [queryme](https://github.com/debackerl/queryme) expression), `order` (use QM.Sort or QM.Order), `limit` (number), `cookie` (string)
* `post(parameters, options, callback)`
 * `options`: `cookie` (string)
* `put(parameters, options, callback)`
 * `options`: `filter` (use [queryme](https://github.com/debackerl/queryme) expression), `cookie` (string)
* `del(parameters, options, callback)`, for `delete` HTTP method (delete is a reserved keyword in ECMAScript)
 * `options`: `filter` (use [queryme](https://github.com/debackerl/queryme) expression), `cookie` (string)

Objects returned by `procedure` have four methods:
* `get(parameters, options, callback)`
 * `options`: `cookie` (string)
* `post(parameters, options, callback)`
 * `options`: `cookie` (string)
* `put(parameters, options, callback)`
 * `options`: `cookie` (string)
* `del(parameters, options, callback)`, for `delete` HTTP method (delete is a reserved keyword in ECMAScript)
 * `options`: `cookie` (string)

The provided `callback` must have type `function(error, result)` or be left unspecified. Arguments are:
* `error`, null if no error detected, otherwise an object with the following members:
 * `httpStatus`, the numeric HTTP status code.
 * `httpStatusText`, the HTTP status message.
 * `description`, additional description of the error may be included here.
* `result`, if no error has been detected, this will be the deserialized JSON value returned by the remote server.

Note: support for setting cookie is for server-side use only. When using from express.js, use `req.get('Cookie')` to retrive cookie sent by browser (where `req` is a request object).

#### Example

```
var ws = new WebService("https://test.com");
var login = ws.procedure("/users/:user_id/login").post;
var projectTasks = ws.relation("/projects/:project_id/tasks");

login({"user_id": "bob", "password": "$3cur3"}, function(res) {
  projectTasks.get({"project_id": 100}, {order: QM.Order("dueDate")}, function(res) { });
});
```

Note: the QM object is defined by [queryme](https://github.com/debackerl/queryme).
