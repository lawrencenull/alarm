'use strict';

const timer = {};
window.timer = timer;

const hours = document.querySelector('.timer input[data-id="hours"]');
const minutes = document.querySelector('.timer input[data-id="minutes"]');
const seconds = document.querySelector('.timer input[data-id="seconds"]');


timer.ms2time = duration => ({
  seconds: Math.floor((duration / 1000) % 60),
  minutes: Math.floor((duration / (1000 * 60)) % 60),
  hours: Math.floor((duration / (1000 * 60 * 60)) % 24)
});

timer.tick = (once = false) => {
  const n = timer.when - Date.now();

  if (n > 0) {
    const o = timer.ms2time(n);
    hours.value = ('00' + o.hours).substr(-2);
    minutes.value = ('00' + o.minutes).substr(-2);
    seconds.value = ('00' + o.seconds).substr(-2);

    window.clearTimeout(timer.id);
    if (once !== true) {
      timer.id = window.setTimeout(timer.tick, 1000);
    }
  }
  else {
    timer.pause(true);
  }
};

timer.start = () => {
  hours.value = Math.max(0, hours.value);
  minutes.value = Math.min(59, Math.max(0, minutes.value));
  seconds.value = Math.min(59, Math.max(0, seconds.value));

  const when = ((Number(hours.value) * 60 + Number(minutes.value)) * 60 + Number(seconds.value)) * 1000;
  if (when) {
    timer.resume(Date.now() + when, 1000);
  }
  else {
    timer.pause(true);
  }
};

timer.pause = (reset = false) => {
  window.clearTimeout(timer.id);
  chrome.runtime.sendMessage({
    method: 'clear-alarm',
    name: 'timer-1'
  });
  if (reset) {
    hours.value = '00';
    minutes.value = '30';
    seconds.value = '00';
    document.body.dataset.timer = 'start';
    localStorage.removeItem('timer-when');
  }
  else {
    document.body.dataset.timer = 'paused';
    localStorage.setItem('timer-when', timer.when - Date.now());
  }
};

timer.resume = (when = timer.when, delay = 0, post = true) => {
  timer.when = when;

  window.clearTimeout(timer.id);
  if (delay >= 0) {
    if (post) {
      chrome.runtime.sendMessage({
        method: 'set-alarm',
        name: 'timer-1',
        info: {
          when: timer.when
        }
      });
    }
    timer.id = window.setTimeout(timer.tick, delay);
    document.body.dataset.timer = 'working';
  }
  else {
    timer.tick(true);
    document.body.dataset.timer = 'paused';
  }
};

// restore
chrome.runtime.sendMessage({
  method: 'get-alarm',
  name: 'timer-1'
}, alarm => {
  if (alarm) {
    if (alarm.scheduledTime > Date.now()) {
      return timer.resume(alarm.scheduledTime, 0, false);
    }
  }
  const w = localStorage.getItem('timer-when');
  if (w) {
    timer.resume(Number(w) + Date.now(), -1);
  }
});
