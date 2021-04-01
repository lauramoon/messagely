const request = require("supertest");

const app = require("../app");
const db = require("../db");
const User = require("../models/user");
const Message = require("../models/message");

describe("User Routes Test", function () {
  beforeEach(async function () {
    await db.query("DELETE FROM messages");
    await db.query("DELETE FROM users");

    let u1 = await User.register({
      username: "test1",
      password: "password",
      first_name: "Test1",
      last_name: "Testy1",
      phone: "+14155550000",
    });
    let u2 = await User.register({
      username: "test2",
      password: "password",
      first_name: "Test2",
      last_name: "Testy2",
      phone: "+14155552222",
    });
    let m1 = await Message.create({
      from_username: "test1",
      to_username: "test2",
      body: "u1-to-u2",
    });
    let m2 = await Message.create({
      from_username: "test2",
      to_username: "test1",
      body: "u2-to-u1",
    });
  });

  /** GET / - get list of users */

  describe("GET /", function () {
    test("get list of users when logged in", async function () {
      const loginResponse = await request(app)
        .post("/auth/login")
        .send({ username: "test1", password: "password" });
      const token = loginResponse.body.token;

      let response = await request(app).get("/users/").send({
        _token: token,
      });
      expect(response.statusCode).toEqual(200);
      expect(response.body).toEqual({
        users: [
          {
            username: "test2",
            first_name: "Test2",
            last_name: "Testy2",
            phone: "+14155552222",
          },
          {
            username: "test1",
            first_name: "Test1",
            last_name: "Testy1",
            phone: "+14155550000",
          },
        ],
      });
    });

    test("get 401 error if no one logged in", async function () {
      let response = await request(app).get("/users/");
      expect(response.statusCode).toEqual(401);
    });
  });

  /** GET /:username - get details for user */

  describe("GET /:username", function () {
    test("get logged-in user", async function () {
      const loginResponse = await request(app)
        .post("/auth/login")
        .send({ username: "test1", password: "password" });
      const token = loginResponse.body.token;

      let response = await request(app).get("/users/test1").send({
        _token: token,
      });
      expect(response.statusCode).toEqual(200);
      expect(response.body).toEqual({
        user: {
          username: "test1",
          first_name: "Test1",
          last_name: "Testy1",
          phone: "+14155550000",
          join_at: expect.any(String),
          last_login_at: expect.any(String),
        },
      });
    });

    test("get 401 error if logged-in user tries to access another user", async function () {
      const loginResponse = await request(app)
        .post("/auth/login")
        .send({ username: "test2", password: "password" });
      const token = loginResponse.body.token;

      let response = await request(app).get("/users/test1").send({
        _token: token,
      });
      expect(response.statusCode).toEqual(401);
    });

    test("get 401 error if no one logged in", async function () {
      let response = await request(app).get("/users/test1");
      expect(response.statusCode).toEqual(401);
    });
  });

  /** GET /:username/to - get messages to user */

  describe("GET /:username/to", function () {
    test("get messages to logged-in user", async function () {
      const loginResponse = await request(app)
        .post("/auth/login")
        .send({ username: "test1", password: "password" });
      const token = loginResponse.body.token;

      let response = await request(app).get("/users/test1/to").send({
        _token: token,
      });

      expect(response.statusCode).toEqual(200);
      expect(response.body).toEqual({
        messages: [
          {
            id: expect.any(Number),
            body: "u2-to-u1",
            sent_at: expect.any(String),
            read_at: null,
            from_user: {
              username: "test2",
              first_name: "Test2",
              last_name: "Testy2",
              phone: "+14155552222",
            },
          },
        ],
      });
    });

    test("get 401 error if logged-in user tries to access another user's messages", async function () {
      const loginResponse = await request(app)
        .post("/auth/login")
        .send({ username: "test2", password: "password" });
      const token = loginResponse.body.token;

      let response = await request(app).get("/users/test1/to").send({
        _token: token,
      });
      expect(response.statusCode).toEqual(401);
    });

    test("get 401 error if no one logged in", async function () {
      let response = await request(app).get("/users/test1/to");
      expect(response.statusCode).toEqual(401);
    });
  });

  /** GET /:username/from - get messages from user */

  describe("GET /:username/from", function () {
    test("get messages from logged-in user", async function () {
      const loginResponse = await request(app)
        .post("/auth/login")
        .send({ username: "test1", password: "password" });
      const token = loginResponse.body.token;

      let response = await request(app).get("/users/test1/from").send({
        _token: token,
      });

      expect(response.statusCode).toEqual(200);
      expect(response.body).toEqual({
        messages: [
          {
            id: expect.any(Number),
            body: "u1-to-u2",
            sent_at: expect.any(String),
            read_at: null,
            to_user: {
              username: "test2",
              first_name: "Test2",
              last_name: "Testy2",
              phone: "+14155552222",
            },
          },
        ],
      });
    });

    test("get 401 error if logged-in user tries to access another user's messages", async function () {
      const loginResponse = await request(app)
        .post("/auth/login")
        .send({ username: "test2", password: "password" });
      const token = loginResponse.body.token;

      let response = await request(app).get("/users/test1/from").send({
        _token: token,
      });
      expect(response.statusCode).toEqual(401);
    });

    test("get 401 error if no one logged in", async function () {
      let response = await request(app).get("/users/test1/from");
      expect(response.statusCode).toEqual(401);
    });
  });
});

afterAll(async function () {
  await db.end();
});
