jQuery.fn.videoControls = function () {
    'use strict';
  
    var instance = {},
  
        create = function (src) {
    
            // Base settings

            instance.playerj = $(src);
            instance.player = instance.playerj[0];
            instance.src_url = instance.playerj.attr('src');
            instance.file_name = instance.src_url.split('.')[0];
            instance.frame_rate = instance.playerj.attr('data-framerate');
            instance.current_position = 0;

            // DOM Elements
            
            instance.playerj.wrap('<div class="video_player"/>');
            instance.wrapper = instance.playerj.parent();
            
            instance.wrapper
                .append('<div class="playbar"><div class="play_head"></div><div class="track_bg"></div><div class="track_loaded"></div></div>')
                .append('<ul><li><a class="button rw" href="#">Rew</a></li><li><a class="button stepRw" href="#">Step Back</a></li><li><a class="button pp play" href="#">Play</a></li><li><a class="button stepFf" href="#">Step Foward</a></li><li><a class="button ff" href="#">FFward</a></li><li class="timer"></li><li>Timecode in: <input type="text" class="timerInput" /></li></ul>')
                .append('<a href="' + instance.src_url + '">Download original</a>');

            instance.player.addEventListener('timeupdate', function () {
                display_timecode();
            }, false);
            
            instance.player.addEventListener('loadedmetadata', function () {
                instance.wrapper.find('.playbar').css('width', instance.playerj.width() + 'px');
                instance.playbar_width = parseInt(instance.wrapper.find('.playbar').css('width'), 10);
                instance.playhead_width = parseInt(instance.wrapper.find('.play_head').css('width'), 10);
            }, false);
            
            instance.player.addEventListener('progress', function (e) {
                loading(e);
            }, false);

            // Setup Controls
            
            instance.wrapper.find('.button.pp').click(function () { playpause(); return false; });
            instance.wrapper.find('.button.stepRw').click(function () { instance.player.currentTime = instance.player.currentTime - 1; return false; });
            instance.wrapper.find('.button.stepFf').click(function () { instance.player.currentTime = instance.player.currentTime + 1; return false; });
            
            instance.wrapper.find('.button.rw').mousedown(function () { seek(-6); return false; });
            instance.wrapper.find('.button.rw').mouseup(function () { seek(1); return false; });
            instance.wrapper.find('.button.ff').mousedown(function () { seek(6); return false; });
            instance.wrapper.find('.button.ff').mouseup(function () { seek(1); return false; });
            
            instance.wrapper.find('.play_head').mousedown(function (e) { playHeadDrag(e); return false; });
            instance.wrapper.find('.track_loaded').mousedown(function (e) { playHeadDrag(e); return false; });
    
            // Control Bar

            instance.wrapper.find('.track_loaded').mousedown(function (e) {
                instance.offset = $(e.target).offset();
            }).click(function (e) {
                position_to_time(e);
            });
            
            activateInput(instance.wrapper.find('.timerInput'), instance.player);
            activateKeyControl();
    
        },
  
        // Control Methods
  
        playpause = function () {
            if (instance.playing) {
                stopMovie();
                instance.playing = false;
            } else {
                playMovie();
                instance.playing = true;
            }
        },
  
        playMovie = function () {
            instance.player.play();
            instance.wrapper.find('.button.pp').removeClass('play').addClass('pause').text('Pause');
        },
  
        stopMovie = function () {
            instance.player.pause();
            instance.wrapper.find('.button.pp').removeClass('pause').addClass('play').text('Play');
        },
  
        seek = function (speed) {
            if (!instance.playing) {
                instance.stopAgain = true;
                playMovie();
            }
            instance.player.playbackRate = speed;
            if (instance.stopAgain && speed === 1) {
                instance.stopAgain = false;
                stopMovie();
            }
        },
  
        // Keyboard Control
  
        activateKeyControl = function () {
            $(document).keydown(function (e) {
                // Space bar
                if (e.keyCode === 32) { playpause(); }
                // Arrows Keys
                if (e.keyCode === 37) {
                    instance.player.currentTime = instance.player.currentTime - 1 / instance.frame_rate;
                }
                if (e.keyCode === 39) {
                    instance.player.currentTime = instance.player.currentTime + 1 / instance.frame_rate;
                }
                if (e.keyCode === 38) {
                    instance.player.currentTime = instance.player.currentTime + 1;
                }
                if (e.keyCode === 40) {
                    instance.player.currentTime = instance.player.currentTime - 1;
                }
            });
        },
  
        // Drag Playhead
  
        playHead = {
            mdown: false
        },
  
        playHeadDrag = function () {
            playHead.mdown = true;
            
            if (instance.playing) {
                instance.startAgain = true;
                stopMovie();
            }
        },
  
        // Document events.

        mouseUpEvent = function () {
            if (playHead.mdown) {
                playHead.mdown = false;
                if (instance.startAgain) {
                    instance.startAgain = false;
                    playMovie();
                }
            }
        },
  
        mouseDownEvent = function (e) {
            if (playHead.mdown) {
                position_to_time(e);
            }
        },
  
        // Timecode Display
  
        display_timecode = function () {
            instance.wrapper.find('.timer').text(formatTimer(instance.player.currentTime));
            instance.playhead = Math.round((instance.player.currentTime / instance.player.duration) * (instance.playbar_width));
            instance.wrapper.find('.play_head').css('left', instance.playhead - (instance.playhead_width / 2) + 'px');
        },
  
        // Timecode Control
  
        activateInput = function (o) {
            var vals, pos, val, newval;
            o.keydown(function (e) {
                if (e.keyCode === 13) {
                    vals = o.val().split(':');
                    pos = 0;
                    
                    pos += parseInt(vals[0], 10) * 60 * 60; // Hours
                    pos += parseInt(vals[1], 10) * 60; // Minutes
                    pos += parseInt(vals[2], 10); // Seconds
                    pos += vals[3] * (1 / instance.frame_rate); // Frames
                    
                    instance.player.currentTime = pos;
                    return false;

                } else if (e.keyCode > 47 && e.keyCode < 58 || e.keyCode > 95 && e.keyCode < 106) {
                    val = o.val().replace(/:/g, '') + String.fromCharCode(e.keyCode);
                    if (val.length <= 8) {
                        newval = '';
                        for (var i = 0; i < val.length; i++) {
                            newval += val.charAt(i);
                            if (i % 2 === 1 && i < 7) { newval += ':'; }
                        }
                        o.val(newval);
                    }
                    return false;

                } else if (e.keyCode === 186 || e.keyCode === 8 || e.keyCode === 46 || e.keyCode > 36 &&
                    e.keyCode < 41) {
                    return true;
                } else {
                    return false;
                }
            }).keyup(function () { return false; });
        },
  
        // Loaders
  
        loading = function () {
            if (instance.player.buffered.end(0) >= instance.player.duration) {
                instance.wrapper.find('.track_loaded').css('width', '100%');
            } else {
                var pl = (instance.player.buffered.end(0) / instance.player.duration) * 100;
                instance.wrapper.find('.track_loaded').css('width', pl + '%');
            }
        },
  
        // Utilities
  
        position_to_time = function (e) {
            var pos, clickx = e.clientX - instance.playerj.offset().left;

            if (clickx >= (instance.playbar_width)) {
                pos = instance.player.duration;
            } else if (clickx <= 0) {
                pos = Math.floor(0);
            } else {
                pos = instance.player.duration * (clickx / instance.playbar_width);
            }

            instance.player.currentTime = pos;
        },

        pad = function (val) {
            if (val < 10) { val = '0' + val; }
            return val;
        },
  
        formatTimer = function (position) {
            var ft_hours = Math.floor((position / (60 * 60)) % 24),
                ft_minutes = Math.floor((position / (60)) % 60),
                ft_seconds = Math.floor((position) % 60),
                ft_frames = Math.floor((position - Math.floor(position)) * instance.frame_rate),
                formattedTime;

            ft_hours += '';
            ft_hours = pad(ft_hours);
            ft_minutes += '';
            ft_minutes = pad(ft_minutes);
            ft_seconds += '';
            ft_seconds = pad(ft_seconds);
            ft_frames += '';
            ft_frames = pad(ft_frames);

            formattedTime = ft_hours + ':' + ft_minutes + ':' + ft_seconds + ':' + ft_frames;
            return formattedTime;
        };
  
    // Binding Events

    $(document).mouseup(mouseUpEvent);
    $(document).mousedown(mouseDownEvent);
  
    return $(this).each(function () {
        create(this);
    });
};