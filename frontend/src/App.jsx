import { useState } from 'react'

function App() {
  const [testTime] = useState(new Date().toLocaleTimeString())

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-950 text-slate-100 p-6 text-center font-sans">
      {/* Título principal con estilo moderno */}
      <h1 className="text-4xl md:text-6xl font-black tracking-tighter text-cyan-400 mb-2 drop-shadow-[0_0_15px_rgba(34,211,238,0.3)]">
        SKYSENTINEL
      </h1>
      
      <div className="w-24 h-1 bg-cyan-500 rounded-full mb-8 animate-pulse"></div>

      {/* Tarjeta de estado */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl max-w-sm w-full">
        <p className="text-sm uppercase tracking-widest text-slate-500 font-bold mb-2">
          Estado del Despliegue
        </p>
        <p className="text-2xl font-semibold text-green-400 mb-6 flex items-center justify-center gap-2">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
          </span>
          SISTEMA ONLINE
        </p>
        
        <div className="text-left space-y-3 text-slate-400 text-sm border-t border-slate-800 pt-6">
          <div className="flex justify-between">
            <span>Dispositivo:</span>
            <span className="text-slate-200 font-mono">OK</span>
          </div>
          <div className="flex justify-between">
            <span>Hora de carga:</span>
            <span className="text-slate-200 font-mono">{testTime}</span>
          </div>
          <div className="flex justify-between">
            <span>Entorno:</span>
            <span className="text-cyan-500 font-mono">DOCKER_DEV</span>
          </div>
        </div>
      </div>

      <p className="mt-8 text-slate-600 text-xs italic">
        TFG SkySentinel - Prueba de Responsividad Multi-dispositivo
      </p>
    </div>
  )
}

export default App