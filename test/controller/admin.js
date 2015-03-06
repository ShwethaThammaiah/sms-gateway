var request = require('supertest'),
    expect  = require('expect.js'),
    express = require('express');

var app = require('../../app.js');

var mongoose = require('mongoose'),
    Application = mongoose.model('Application');

describe('admin api', function(){
  before(function(){
    Application.collection.remove(function(err){

    });
  });

  it('get applications',function(done){

    application = new Application({name: "App Name", secret: "Secret", active: true, send: {limit: 2000, count: 0}});
    application.save(function(err){
      expect(err).to.be(null);
      request(app)
          .get('/admin/application')
          .expect(200)
          .end(function(err, res){
              if (err) return done(err);
              expect(res.body).to.have.length(1);
              expect(res.body[0].name).to.be("app name");
              done();
          });
    });

  });


  describe('create application',function(){
    after(function(){
      Application.collection.remove(function(err){

      });
    });

    it('fail without name',function(done){
      request(app)
        .post('/admin/application')
        .send({"secret": "123"})
        .expect(400)
        .expect("name is required",done);
    });

    it('fail without secret',function(done){
      request(app)
        .post('/admin/application')
        .send({"name": "new name"})
        .expect(400)
        .expect("secret is required",done);
    });

    it('create with valid name and secret',function(done){
      var expectedJson={
        "name": "new name",
        "active": true,
        "send": {
           "limit": 200000,
           "count": 0
        }
      };
      request(app)
        .post('/admin/application')
        .send({"name": "new name","secret": "123"})
        .expect(201)
        .expect(JSON.stringify(expectedJson),done);
    });

    it('validate that the name of the application is unique', function(done){
      application = new Application({name: "Unique Name", secret: "Secret", active: true, send: {limit: 2000, count: 0}});
      application.save(function(err){
        expect(err).to.be(null);
        request(app)
          .post('/admin/application')
          .send({"name": "Unique name","secret": "Secret"})
          .expect(400)
          .expect("Application with name 'unique name' already exists.",done);
      });
    });
  });
});