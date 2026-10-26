import {defineConfig} from 'vite';
import react from '@vitejs/plugin-react';
export default defineConfig({base:'./',plugins:[react()],build:{target:'es2022',rollupOptions:{output:{manualChunks:{three:['three','three/addons/controls/OrbitControls.js','three/addons/environments/RoomEnvironment.js'],exports:['three/addons/exporters/GLTFExporter.js','three/addons/exporters/STLExporter.js'],react:['react','react-dom/client']}}}}});
