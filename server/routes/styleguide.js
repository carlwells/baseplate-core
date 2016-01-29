import path from 'path';
import express from 'express';
import swatches from '../lib/swatches';
import styleguideDefaults from '../styleguide-defaults.json';

const router = new express.Router({
    mergeParams: true
});

router.get('/', (req, res) => {
    let locals = req.app.locals;
    let styleguide = Object.assign(
        styleguideDefaults,
        locals.styleguideOptions
    );
    res.render(path.resolve(locals.clientDir, 'styleguide'), {
        intro: styleguide.intro,
        colors: swatches(styleguide.colors),
        fontStacks: styleguide.fontStacks
    });
});

module.exports = router;
