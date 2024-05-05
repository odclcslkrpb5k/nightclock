/*
  NightClock page logic
  2024-05-04, 05 gbk
*/

const colors = [
  'green',
  'red',
  'blue',
  'yellow',
  'white',
  'orange',
];
var color_index = -1;
var dimming = 0;

// the amazon docs recommend this, I guess some of their implementations are not up to date?
const ac = new(window.AudioContext || window.webkitAudioContext)();

// some tiny functions to control the audio

const start = () => ac.resume();
const stop = () => ac.suspend();
const pause_resume = () => (ac.state === 'running') ? stop() : start();

// if the page is hidden (app went into background, etc), stop the audio, otherwise start it
const visChanged = () => (document.hidden || document.webkitHidden) ? stop() : start();

// color control stuff
const cycle_color = (direction = true) => {
  if(direction) color_index = (color_index + 1) % colors.length;
  else color_index = (color_index - 1 + colors.length) % colors.length;
  // remove existing color classes from the #clock element
  document.getElementById('clock').classList.remove(...colors);
  // add the new color class
  document.getElementById('clock').classList.add(colors[color_index]);
};
// dimming/brightness control
const set_dimming = (value) => document.getElementById('overlay').style.opacity = value;
const increase_dimming = () => {
  dimming = Math.min(1, dimming + 0.1);
  set_dimming(dimming);
};
const decrease_dimming = () => {
  dimming = Math.max(0, dimming - 0.1);
  set_dimming(dimming);
};


// listen for visibility changes
document.addEventListener('webkitvisibilitychange', visChanged);
document.addEventListener('visibilitychange', visChanged);

// create a brown noise generator

// https://noisehack.com/generate-noise-web-audio-api/
var bufferSize = 4096;
(function() {
    var lastOut = 0.0;
    var node = ac.createScriptProcessor(bufferSize, 1, 1);
    node.onaudioprocess = function(e) {
        var output = e.outputBuffer.getChannelData(0);
        for (var i = 0; i < bufferSize; i++) {
            var white = Math.random() * 2 - 1;
            output[i] = (lastOut + (0.02 * white)) / 1.02;
            lastOut = output[i];
            output[i] *= 3.5; // (roughly) compensate for gain
        }
    }
    return node;
})().connect(ac.destination);


// create a clock
var clock_interval = null;
const formatter = new Intl.DateTimeFormat('it-IT', { timeStyle: 'short' });
const set_clock = () => document.getElementById('clock').innerText = formatter.format(new Date());

// set up the page after it loads
document.addEventListener('DOMContentLoaded', () => {
  if(clock_interval !== null) clearInterval(clock_interval);
  clock_interval = setInterval(set_clock, 1000);
  set_clock();
  cycle_color();
  set_dimming(dimming);
});

// listen for key presses
document.onkeydown = function(e) {
  switch (e.keyCode) {
    case 27: // back button
      stop();
      break;
    case 32: // space
    case 13: // "OK" remote button, also the return button
    case 179: // play/pause remote button
      pause_resume();
      break;
    case 37: // left arrow
      cycle_color(false);
      break;
    case 39: // right arrow
      cycle_color();
      break;
    case 38: // up arrow
      decrease_dimming();
      break;
    case 40: // down arrow
      increase_dimming();
      break;
    // case 227: // rewind
    // case 228: // fast forward
  }
};
