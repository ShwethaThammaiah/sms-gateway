var express = require('express'),
    router = express.Router(),
    mongoose = require('mongoose'),
    _ = require('underscore'),
    basicAuth = require('basic-auth'),
    Application = mongoose.model('Application'),
    User = mongoose.model('User'),
    validate = require("validate.js");


/**
 * export admin routes to the application.
 * All the admin related rest api urls are under
 * /admin path.
 *
 * @param  {object} express application object
 */
module.exports = function (app) {
    app.use('/admin',auth, router);
};


/**
 * auth middleware responsible for doing basic authentication
 * for all admin REST apis
 *
 * @param  {object} req  http request object
 * @param  {object} res  http response object
 * @param  {callback} next http callback for the next middleware or route
 */
var auth = function (req, res, next) {
  var user = basicAuth(req);

  if (user) {
    User.authorize(user.name,user.pass,function(err,usr){
      if (err) {
        res.set('WWW-Authenticate', 'Basic realm=Authorization Required');
        return res.sendStatus(401);
      }
      // If the authentication sucessful then assign the admin user object in request
      req.user = usr;
      next();
    });
  }else{
    res.set('WWW-Authenticate', 'Basic realm=Authorization Required');
    return res.sendStatus(401);
  }
};


/**
 * GET /admin/application.
 *
 * This api respond with all the registered applications.
 */
router.get('/application',function(req, res, next){
  Application.find(function(err,applications){
    if (err) return errorHandler(500,err,res);
    res.status(200).json(applications);
  });
});


/**
 * POST /admin/application
 *
 * This api is for creating a new application
 * It expect a json data with name & secret of application.
 * e.g
 * {
 *  "name": "application_name",
 *  "secret": "application secret"
 * }
 *
 */
router.post('/application',function(req,res,next){
  application = new Application({name: req.body.name, secret: req.body.secret, active: true, send: {limit: 200000, count: 0}});
  application.save(function(err,app){
    if (err) return errorHandler(400,err,res);
    res.status(201).json(app.toJSON());
  });
});


/**
 * GET /admin/application/<application_name>
 *
 * This api is for getting details of an individual application
 * by specify its name
 */
router.get('/application/:name',function(req, res, next){
  Application.findOne({name: req.params.name},function(err,application){
    if (err) return errorHandler(404,err,res);
    if(application){
        return res.status(200).json(application);
    }

    return res.status(404).send("Unable to find application with name '"+req.params.name+"'");
  });
});



/**
 * POST /admin/application/<application_name>/disable
 *
 * API for disable specified application.
 *
 */
router.post('/application/:name/disable', function(req,res,next){
    var query = {name: req.params.name, active: 'true'};
    var update = {active: 'false'};
    var options = {new: true};

    Application.findOneAndUpdate(query, update, options, function(err, application) {
      if (err) {
        return errorHandler(404,err,res);
      }
      if(application){
              return res.status(200).json(application);
      }
      return res.status(404).send("Unable to find and disable application '"+req.params.name+"'");
    });
});

/**
 * POST /admin/application/<application_name>/enable
 *
 * API for enable specified application.
 *
 */
router.post('/application/:name/enable', function(req,res,next){
    var query = {name: req.params.name, active: 'false'};
    var update = {active: 'true'};
    var options = {new: true};

    Application.findOneAndUpdate(query, update, options, function(err, application) {
      if (err) {
        return errorHandler(404,err,res);
      }
      if(application){
              return res.status(200).json(application);
      }
      return res.status(404).send("Unable to find and enable application '"+req.params.name+"'");
    });
});

/**
 * POST /admin/application/<application_name>/limit
 *
 * API for changing sms limit of a specified application.
 * It expect a json data with new limit as shown below.
 * e.g
 * {
 *  "limit": 20000
 * }
 *
 */
 router.post('/application/:name/limit', function(req,res,next){
    var query = {name: req.params.name};
    var newLimit = req.body.limit;
    if(!isInteger(newLimit)){
        return errorHandler(404,"Limit should be a number",res);
    }
    var update = {'send.limit': newLimit};
    var options = {new: true};

    Application.findOneAndUpdate(query, update, options, function(err, application) {
      if (err) {
        return errorHandler(404,err,res);
      }
      if(application){
              return res.status(200).json(application);
      }
      return res.status(404).send("Unable to find and change sms limit for application '"+req.params.name+"'");
    });
});

/**
 * POST /admin/password
 *
 * API for changing admin user's password
 * It expect a json data with new limit as shown below.
 * e.g
 * {
 *  "new_password": "this is my new password"
 * }
 *
 */
router.post('/password', function(req,res,next){
    var user = req.user;
    var err = validate({password : req.body.new_password}, {password: {presence: true}});

        if (err){
            return errorHandler(400,err.password.join(),res);
        }

        user.password = req.body.new_password;
              user.save(function(err,app){
                if (err) return errorHandler(400,"Unable to update password for user '" + user.name + "'",res);
                res.status(200).send("Password changed successfully for user '" + user.name +"'");
        });
});

/**
 * errorHandler - for handling the error and send it to the client.
 *
 * @param  {Number} code HTPP code which needs to send to client
 * @param  {error} err  error object
 * @param  {object} res  http response object
 */
function errorHandler(code,err,res){
  var messages=err;
  if (typeof err.errors != 'undefined'){
    messages = _.map(err.errors,function(value, field){
      return value.message;
    }).join();
  }
  res.status(code).send(messages);
}


/**
 * isInteger - check whether the input data is an integer type or not
 *
 * @param  {object} x input data for checking
 * @return {boolean} true if it is integer otherwise false.
 */
function isInteger(x) {
  return (typeof x === 'number') && (Math.round(x) === x);
}
