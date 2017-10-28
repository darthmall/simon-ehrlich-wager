import * as actions from "../actions";

const DEFAULT_STATE = {
  startDate: 1980,
  duration: 10
};

export default function wagerApp(state, action) {
  if (typeof state === "undefined") return DEFAULT_STATE;
  
  switch(action.type) {
    
  case actions.SET_START_DATE:
    return Object.assign({}, state, {startDate: action.payload});
    
  case actions.SET_DURATION:
    return Object.assign({}, state, {duration: action.payload});
    
  default:
    return state;
    
  }
}