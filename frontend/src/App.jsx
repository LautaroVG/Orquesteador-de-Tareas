import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Trash2, Clock, XCircle, Terminal, } from 'lucide-react';

const API_BASE = "http://127.0.0.1:8000";

function App() {
  const [tasks, setTasks] = useState([]);
  const [formData, setFormData] = useState({ name: '', cron: '1', script_path: '' });
  const [selectedTask, setSelectedTask] = useState(null);
  const [logs, setLogs] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [loadingLogs, setLoadingLogs] = useState(false);

  // --- FUNCIÓN DE CARGA ---
  const fetchTasks = useCallback(async () => {
    try {
      const res = await axios.get(`${API_BASE}/tasks`);
      setTasks(res.data);
    } catch (err) {
      console.error("No se pudo conectar con el servidor:", err.message);
    }
  }, []);

  // --- CONTROL DE EFECTOS ---
  useEffect(() => {
    let isMounted = true; // Banderita de seguridad

    const initFetch = async () => {
      // Solo actualiza si el componente sigue vivo en pantalla
      if (isMounted) {
        await fetchTasks();
      }
    };

    initFetch(); // Llamada inicial
    
    // Configura el intervalo de 30 segundos
    const interval = setInterval(initFetch, 30000);

    // Cleanup: se ejecuta cuando el componente se destruye
    return () => {
      isMounted = false; 
      clearInterval(interval);
    };
  }, [fetchTasks]);

  // --- ACCIONES ---
  async function createTask(e) {
    e.preventDefault();
    try {
      // Se envía un objeto JSON puro, el estándar de la industria
      const payload = {
        name: formData.name,
        cron: formData.cron,
        script_path: formData.script_path
      };

      console.log("Enviando petición POST a:", `${API_BASE}/tasks`);
      
      await axios.post(`${API_BASE}/tasks`, payload);
      
      setFormData({ name: '', cron: '1', script_path: '' });
      await fetchTasks();
      alert("¡Tarea creada exitosamente!");
    } catch (err) {
      console.error("Error detallado:", err.response || err);
      // Extraemos el error limpio de FastAPI si falla la validación Pydantic
      const mensaje = err.response?.data?.detail || err.message;
      const errorFinal = Array.isArray(mensaje) ? JSON.stringify(mensaje) : mensaje;
      alert(`Error al crear: ${errorFinal}`);
    }
  }

  async function deleteTask(id) {
    if (!window.confirm("¿Estás seguro de eliminar esta tarea?")) return;
    try {
      await axios.delete(`${API_BASE}/tasks/${id}`);
      fetchTasks();
    } catch (err) {
      console.error(err);
      alert("Error al borrar la tarea.");
    }
  }

  async function fetchLogs(task) {
    setLoadingLogs(true);
    setSelectedTask(task);
    try {
      const res = await axios.get(`${API_BASE}/tasks/${task.id}/logs`);
      setLogs(res.data);
      setShowModal(true);
    } catch (err) {
      console.error(err)
      alert("Error al traer los logs.");
    } finally {
      setLoadingLogs(false);
    }
  }

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 font-sans p-6">
      <header className="max-w-5xl mx-auto mb-12 border-b border-zinc-200 pb-8 flex justify-between items-end">
        <h1 className="text-4xl font-black italic tracking-tighter">TASKFLOW</h1>
        <div className="flex items-center gap-2 px-3 py-1 bg-white border border-zinc-200 rounded-full text-[10px] font-bold text-zinc-500 shadow-sm">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div> API ACTIVE
        </div>
      </header>

      <main className="max-w-5xl mx-auto">
        <section className="bg-white p-8 rounded-[2rem] border border-zinc-200 shadow-sm mb-12">
          <form onSubmit={createTask} className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <input 
              className="bg-zinc-100 p-4 rounded-xl outline-none focus:ring-2 focus:ring-zinc-300 text-sm transition-all"
              placeholder="Nombre de la tarea" 
              value={formData.name}
              onChange={e => setFormData({...formData, name: e.target.value})}
              required
            />
            <input 
              className="bg-zinc-100 p-4 rounded-xl outline-none focus:ring-2 focus:ring-zinc-300 text-sm transition-all"
              placeholder="Script (ej. backup.py)" 
              value={formData.script_path}
              onChange={e => setFormData({...formData, script_path: e.target.value})}
              required
            />
            <input 
              className="bg-zinc-100 p-4 rounded-xl outline-none focus:ring-2 focus:ring-zinc-300 text-sm transition-all"
              type="number" 
              placeholder="Intervalo (min)"
              value={formData.cron}
              onChange={e => setFormData({...formData, cron: e.target.value})}
              required
              min="1"
            />
            <button type="submit" className="bg-zinc-900 text-white rounded-xl font-bold hover:bg-black transition-colors shadow-md">
              DESPLEGAR
            </button>
          </form>
        </section>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {tasks.map(task => (
            <div key={task.id} className="bg-white p-6 rounded-[2rem] border border-zinc-200 flex flex-col hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-4">
                <Terminal size={24} className="text-zinc-900" />
                <button onClick={() => deleteTask(task.id)} className="text-zinc-300 hover:text-red-500 transition-colors">
                  <Trash2 size={18}/>
                </button>
              </div>
              <h3 className="text-xl font-bold">{task.name}</h3>
              <p className="text-xs text-zinc-400 font-mono mt-1">/{task.script_path}</p>
              <div className="mt-6 pt-6 border-t border-zinc-50 flex justify-between items-center">
                <span className="text-[10px] font-bold text-zinc-400 flex items-center gap-1">
                  <Clock size={12}/> {task.cron_expression}m
                </span>
                <button 
                  onClick={() => fetchLogs(task)}
                  className="bg-zinc-100 px-4 py-2 rounded-full text-[10px] font-black hover:bg-zinc-900 hover:text-white transition-all disabled:opacity-50"
                  disabled={loadingLogs}
                >
                  VER LOGS
                </button>
              </div>
            </div>
          ))}
          {tasks.length === 0 && (
            <div className="col-span-1 md:col-span-2 text-center py-12 text-zinc-400 font-medium">
              No hay tareas desplegadas aún.
            </div>
          )}
        </div>
      </main>

      {/* MODAL SIMPLIFICADO */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 transition-opacity">
          <div className="bg-white rounded-[2rem] w-full max-w-lg p-8 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-zinc-900">{selectedTask?.name}</h2>
              <button onClick={() => setShowModal(false)} className="text-zinc-300 hover:text-zinc-600 transition-colors">
                <XCircle size={24} />
              </button>
            </div>
            <div className="space-y-2 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
              {logs.length > 0 ? logs.map(log => (
                <div key={log.id} className="flex justify-between items-center p-3 bg-zinc-50 border border-zinc-100 rounded-xl text-xs">
                  {/* Se formatea la fecha si viene como string */}
                  <span className="font-bold text-zinc-500">
                    {new Date(log.execution_time).toLocaleString()}
                  </span>
                  <span className={`font-bold px-2 py-1 rounded-md ${log.status === "Success" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                    {log.status}
                  </span>
                </div>
              )) : (
                <div className="text-center py-8 text-zinc-400 text-sm">
                  No hay registros de ejecución para esta tarea.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;