/* eslint-env node */
var test = require("tape");

import * as actions from "../src/actions";
import wagerApp from "../src/reducers";

test("Reducer should default to the original bet parameters", function (t) {
  const expected = {
    startDate: 1980,
    duration: 10
  };
  
  t.plan(1);
  t.deepEqual(wagerApp(), expected);
});

test("Reducer should update the start date", function (t) {
  const expected = {
    startDate: 1982,
    duration: 10
  };
  
  const action = {
    type: actions.SET_START_DATE,
    payload: 1982
  };
  
  t.plan(1);
  t.deepEqual(wagerApp(wagerApp(), action), expected);
});

test("Reducer should update the duration", function (t) {
  const expected = {
    startDate: 1980,
    duration: 1
  };
  
  const action = {
    type: actions.SET_DURATION,
    payload: 1
  };
  
  t.plan(1);
  t.deepEqual(wagerApp(wagerApp(), action), expected);
});
