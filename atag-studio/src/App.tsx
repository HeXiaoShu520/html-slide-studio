import TopBar from './components/TopBar'
import LeftPanel from './components/LeftPanel'
import RightPanel from './components/RightPanel'
import AIPanel from './components/AIPanel'
import GrapesEditor from './editor/GrapesEditor'

export default function App() {
  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden">
      <TopBar />
      <div className="flex flex-1 overflow-hidden">
        <LeftPanel />
        <GrapesEditor />
        <RightPanel />
      </div>
      <AIPanel />
    </div>
  )
}
