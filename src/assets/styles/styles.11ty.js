const fs = require('fs')
const path = require('path')
const sass = require('sass')
const CleanCSS = require('clean-css')
const cssesc = require('cssesc')

const isProd = process.env.ELEVENTY_ENV === 'production'

// main entry point name
const ENTRY_FILE_NAME = 'main.scss'

module.exports = class {
    async data() {
        const entryPath = path.join(__dirname, `/${ENTRY_FILE_NAME}`)
        return {
            permalink: `/assets/styles/main.css`,
            eleventyExcludeFromCollections: true,
            entryPath
        }
    }

    // Compile Sass to CSS
    compile(scssFile) {
        return sass.compile(scssFile, {
            style : isProd ? 'compressed' : 'expanded'
        }).css;
    }

    // Minify & Optimize with CleanCSS in Production
    minify(css) {
        if (!isProd) {
            return css
        }
        return new CleanCSS().minify(css).styles
    }

    // display an error overlay when CSS build fails.
    // this brilliant idea is taken from Mike Riethmuller / Supermaya
    // @see https://github.com/MadeByMike/supermaya/blob/master/site/utils/compile-scss.js
    renderError(error) {
        return `
        /* Error compiling stylesheet */
        *,
        *::before,
        *::after {
            box-sizing: border-box;
        }
        html,
        body {
            margin: 0;
            padding: 0;
            min-height: 100vh;
            font-family: monospace;
            font-size: 1.25rem;
            line-height:1.5;
        } 
        body::before { 
            content: ''; 
            background: #000;
            top: 0;
            bottom: 0;
            width: 100%;
            height: 100%;
            opacity: 0.7;
            position: fixed;
        }
        body::after { 
            content: '${cssesc(error)}'; 
            white-space: pre;
            display: block;
            top: 0; 
            padding: 30px;
            margin: 50px;
            width: calc(100% - 100px);
            color:#721c24;
            background: #f8d7da;
            border: solid 2px red;
            position: fixed;
        }`
    }

    // render the CSS file
    async render({ entryPath }) {
        try {
            const css = this.compile(entryPath)
            return this.minify(css)
        } catch (err) {
            if (isProd) {
                throw new Error(err)
            } else {
                console.error(err)
                const msg = err.formatted || err.message
                return this.renderError(msg)
            }
        }
    }
}
