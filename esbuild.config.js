const esbuild = require('esbuild');
const fs = require('fs');
const path = require('path');

const outdir = 'dist';

async function build() {
    try {
        // Ensure the output directory is clean
        if (fs.existsSync(outdir)) {
            fs.rmSync(outdir, { recursive: true, force: true });
        }
        fs.mkdirSync(outdir);

        // Build the main JS bundle
        await esbuild.build({
            entryPoints: ['index.tsx'],
            bundle: true,
            outfile: path.join(outdir, 'bundle.js'),
            loader: { '.tsx': 'tsx' },
            jsx: 'automatic',
            sourcemap: true,
            minify: true,
            define: {
                'process.env.NODE_ENV': '"production"',
            },
        });

        // Copy the public HTML file to the output directory
        fs.copyFileSync('index.html', path.join(outdir, 'index.html'));
        
        console.log('Build successful!');
    } catch (e) {
        console.error('Build failed:', e);
        process.exit(1);
    }
}

build();
