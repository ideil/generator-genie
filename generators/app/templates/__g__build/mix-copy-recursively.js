/* globals path */

const
    mix = require('laravel-mix'),
    glob = require('glob');

class CopyRecursively {
    name() {
        return ['copyR', 'copyr', 'copyRecursively', 'copyrecursively'];
    }

    register(options = {}) {
        const
            Files = glob.sync(path.join(options.input, options.pattern));

        Files.forEach(file => {
            const
                name = path.basename(file),
                output = file.replace(options.input, options.output).replace(name, '');

            mix.copy(file, output);
        });
    }
}

mix.extend('copyR', new CopyRecursively());
