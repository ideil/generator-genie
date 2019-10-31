/* globals describe, beforeAll, it */

'use strict';

const path = require('path');
const assert = require('yeoman-assert');
const helpers = require('yeoman-test');

describe('generator-genie:app', () => {
    beforeAll(() => {
        return helpers
            .run(path.join(__dirname, '../generators/app'))
            .withPrompts({ someAnswer: true });
    });

    it('creates files', () => {
        assert.file([
            'README.md',
            'LICENSE.md',
            '.editorconfig',
            'package.json',
            '.jshintrc',
            'webpack.mix.js',
        ]);
    });
});
