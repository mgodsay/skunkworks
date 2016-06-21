var jsonServer = require('json-server');
var server = jsonServer.create()
var router = jsonServer.router('db.json')
var middlewares = jsonServer.defaults()

router.render = function (req, res) {
  res.jsonp({
   body: res.locals.data
  })
}

server.get('/echo', function (req, res) {
  res.jsonp(req.query)
})

server.use(middlewares)
server.use(router)
server.listen(3000, function () {
  console.log('JSON Server is running')
});