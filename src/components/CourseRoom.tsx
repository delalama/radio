import { useEffect, useState } from 'react'
import { Anchor, ArrowLeft, BookOpen, Check, CheckCircle2, ClipboardCheck, ExternalLink, Radio, Ship } from 'lucide-react'
import { courseModules, courseSources } from '../course'

interface CourseProgress { completed: string[]; checked: Record<string, string[]> }

export function CourseRoom({ code }: { code: string }) {
  const storageKey = `roca-course-progress-${code}`
  const [selectedId, setSelectedId] = useState(courseModules[0].id)
  const [progress, setProgress] = useState<CourseProgress>(() => {
    try { return JSON.parse(localStorage.getItem(storageKey) ?? '{"completed":[],"checked":{}}') }
    catch { return { completed: [], checked: {} } }
  })
  const lesson = courseModules.find(module => module.id === selectedId) ?? courseModules[0]
  const checked = progress.checked[lesson.id] ?? []
  const theoryCount = courseModules.filter(module => !module.practice).length
  const practicalCount = courseModules.filter(module => module.practice).length
  const completedCount = progress.completed.length

  useEffect(() => { localStorage.setItem(storageKey, JSON.stringify(progress)) }, [progress, storageKey])

  const toggleTask = (task: string) => setProgress(current => {
    const tasks = current.checked[lesson.id] ?? []
    const nextTasks = tasks.includes(task) ? tasks.filter(item => item !== task) : [...tasks, task]
    return { ...current, checked: { ...current.checked, [lesson.id]: nextTasks } }
  })
  const markComplete = () => setProgress(current => ({ ...current, completed: current.completed.includes(lesson.id) ? current.completed : [...current.completed, lesson.id] }))
  const returnToDesk = `?role=student&session=${code}`

  return <main className="course-app">
    <header className="topbar course-topbar"><a className="course-brand" href={returnToDesk}><span className="brand-mark"><Anchor size={18}/></span><span>NORTHLINE <small>MARITIME TRAINING</small></span></a><div className="course-top-title"><BookOpen size={15}/> AULA RADIO-OPERADOR CORTO ALCANCE</div><div className="course-top-actions"><span>SESIÓN {code}</span><a className="role-switch" href={returnToDesk}><ArrowLeft size={14}/> VOLVER AL COCKPIT</a></div></header>
    <div className="course-layout"><aside className="course-sidebar"><div className="course-sidebar-heading"><span className="eyebrow">CURSO PRÁCTICO</span><h1>Radio VHF / DSC</h1><p>Programa formativo ROCA · España</p></div><div className="course-progress"><div><span>PROGRESO DEL ALUMNO</span><b>{completedCount} / {courseModules.length}</b></div><div className="progress-track"><i style={{ width: `${completedCount / courseModules.length * 100}%` }}/></div><small>Guardado en este navegador</small></div><nav className="module-list" aria-label="Unidades del curso">{courseModules.map(module => <button key={module.id} className={`module-link ${module.id === lesson.id ? 'selected' : ''}`} onClick={() => setSelectedId(module.id)}><span className="module-number">{progress.completed.includes(module.id) ? <Check size={13}/> : module.id}</span><span className="module-link-copy"><b>{module.title}</b><small>{module.area}</small></span>{progress.completed.includes(module.id) && <CheckCircle2 className="module-complete" size={14}/>}</button>)}</nav><div className="course-plan"><div><span className="plan-icon"><BookOpen size={14}/></span><span>{theoryCount} h<small>fundamentos</small></span></div><div><span className="plan-icon practice"><Radio size={14}/></span><span>{practicalCount} h<small>prácticas</small></span></div><p>La duración mínima ROCA y las horas prácticas se basan en el Anexo IV del RD 875/2014.</p></div></aside>
      <section className="course-content"><div className="course-breadcrumb"><span>PROGRAMA ROCA</span><span>/</span><span>{lesson.practice ? 'PRÁCTICA GUIADA' : 'FUNDAMENTOS'}</span><span>/</span><b>UNIDAD {lesson.id}</b></div><div className="lesson-heading"><div><span className={`lesson-tag ${lesson.practice ? 'practice' : ''}`}>{lesson.practice ? 'PRÁCTICA DE SIMULADOR' : 'FORMACIÓN TEÓRICA'}</span><h2>{lesson.title}</h2><p>{lesson.objective}</p></div><span className="lesson-duration">60 <small>MIN</small></span></div>
        <div className="lesson-callout"><span className="callout-icon"><ClipboardCheck size={18}/></span><div><b>{lesson.practice ? 'Tareas de práctica' : 'Comprueba que puedes explicar'}</b><p>{lesson.practice ? 'Realiza las tareas con la radio virtual y con el escenario que asigne el instructor. Marca cada una cuando puedas ejecutarla o explicarla.' : 'Marca cada objetivo después de repasarlo. Las unidades teóricas preparan las prácticas de radio.'}</p></div></div>
        <div className="lesson-columns"><section className="lesson-card"><div className="lesson-card-heading"><span>CONTENIDO ESENCIAL</span><span>{lesson.points.length} PUNTOS</span></div><ul className="learning-points">{lesson.points.map(point => <li key={point}><span className="point-mark">·</span>{point}</li>)}</ul></section><section className="lesson-card task-card"><div className="lesson-card-heading"><span>{lesson.practice ? 'EJERCICIO EN EL SIMULADOR' : 'REPASO ACTIVO'}</span><span>{checked.length}/{lesson.tasks.length}</span></div><div className="task-list">{lesson.tasks.map((task, index) => <label key={task} className={`task-item ${checked.includes(task) ? 'checked' : ''}`}><input type="checkbox" checked={checked.includes(task)} onChange={() => toggleTask(task)}/><span className="task-index">{String(index + 1).padStart(2, '0')}</span><span>{task}</span></label>)}</div><a className="open-cockpit" href={`${returnToDesk}&open=vhf`}><Radio size={15}/> ABRIR RADIO VHF VIRTUAL <Ship size={14}/></a></section></div>
        <div className="lesson-footer"><button className={`complete-lesson ${progress.completed.includes(lesson.id) ? 'done' : ''}`} disabled={!progress.completed.includes(lesson.id) && checked.length < lesson.tasks.length} onClick={markComplete}>{progress.completed.includes(lesson.id) ? <><CheckCircle2 size={16}/> UNIDAD COMPLETADA</> : <><Check size={16}/> MARCAR UNIDAD COMPLETADA</>}</button><button className="next-lesson" onClick={() => { const index = courseModules.findIndex(module => module.id === lesson.id); setSelectedId(courseModules[(index + 1) % courseModules.length].id) }}>SIGUIENTE UNIDAD →</button></div>
        <section className="course-sources"><div><span className="eyebrow">FUENTES OFICIALES DEL PROGRAMA</span><p>Los contenidos de procedimientos se contrastan con la normativa española y las publicaciones de ITU, IMO y Salvamento Marítimo.</p></div><div className="source-links">{courseSources.map(source => <a href={source.url} key={source.url} target="_blank" rel="noreferrer">{source.label}<ExternalLink size={12}/></a>)}</div></section>
        <div className="course-footnote">Este itinerario didáctico toma como referencia el programa oficial ROCA. El registro de progreso es local y no acredita la superación oficial del curso.</div>
      </section>
    </div>
  </main>
}
