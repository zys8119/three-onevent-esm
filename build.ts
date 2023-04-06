import {build} from "esbuild"
build({
    entryPoints:[
        "src/onEvent.ts"
    ],
    outdir:'dist',
    platform:"browser",
    globalName:'asa',
})
