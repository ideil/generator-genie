//# Utilities
//
//*

/* eslint one-var: 0 */

//## Screen Match
//
//* Define if screen match threshold

// import { ScreenMatch } from '@class/utilities';
// isBoxVisible = new ScreenMatch(dataBoxThreshold).define();

class ScreenMatch {
    constructor(size, isValue) {
        this.size = size;
        this.isValue = isValue;
        this.screen = {
            sm: 425,
            md: 768,
            lg: 1024,
            xl: 1280,
        };
    }

    define() {
        let result;

        if (this.isValue) {
            result = this.screen[this.size];
        } else {
            result =
                window.matchMedia(
                    `(min-width: ${ this.screen[this.size] }px)`
                ).matches;
        }

        return result;
    }
}


//## Debounce
//
//* Credits: https://codeburst.io/throttling-and-debouncing-in-javascript-b01cad5c8edf

//** Example of use
// const
//     resize = debounce(() => {
//         console.info('Hey! It is', new Date().toUTCString());
//     }, 17);
// window.addEventListener('resize', resize);

const debounce = (func, delay) => {
    let inDebounce;

    return function () {
        const
            context = this,
            args = arguments;

        clearTimeout(inDebounce);

        inDebounce = setTimeout(() => func.apply(context, args), delay);
    };
};


//# Throttle
//
//* Credits: https://codeburst.io/throttling-and-debouncing-in-javascript-b01cad5c8edf

//** Example of use
// const
//     resize = throttle(() => {
//         console.info('Hey! It is', new Date().toUTCString());
//     }, 17);
// window.addEventListener('resize', resize);

const throttle = (func, limit) => {
    let lastFunc, lastRan;

    return function () {
        const
            context = this,
            args = arguments;

        if (!lastRan) {
            func.apply(context, args);

            lastRan = Date.now();
        } else {
            clearTimeout(lastFunc);

            lastFunc = setTimeout(function () {
                if ((Date.now() - lastRan) >= limit) {
                    func.apply(context, args);

                    lastRan = Date.now();
                }
            }, limit - (Date.now() - lastRan));
        }
    };
};


//## Export
//
//* import * as Utils from '@js/class/utilities';

export { ScreenMatch, debounce, throttle };
