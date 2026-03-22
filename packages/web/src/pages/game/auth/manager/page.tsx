import type { QuizzWithId } from "@rahoot/common/types/game"
import { STATUS } from "@rahoot/common/types/game/status"
import SelectQuizz from "@rahoot/web/features/game/components/create/SelectQuizz"
import {
    useEvent,
    useSocket,
} from "@rahoot/web/features/game/contexts/socketProvider"
import { useManagerStore } from "@rahoot/web/features/game/stores/manager"
import { useEffect, useState } from "react"
import { useNavigate } from "react-router"

const ManagerAuthPage = () => {
  const { setGameId, setStatus } = useManagerStore()
  const navigate = useNavigate()
  const { socket } = useSocket()

  const [isAuth, setIsAuth] = useState(false)
  const [quizzList, setQuizzList] = useState<QuizzWithId[]>([])

  useEffect(() => {
    if (socket && !isAuth) {
      socket.emit("manager:auth")
    }
  }, [socket, isAuth])

  useEvent("manager:quizzList", (quizzList) => {
    setIsAuth(true)
    setQuizzList(quizzList)
  })

  useEvent("manager:gameCreated", ({ gameId, inviteCode }) => {
    setGameId(gameId)
    setStatus(STATUS.SHOW_ROOM, { text: "في انتظار اللاعبين", inviteCode })
    navigate(`/party/manager/${gameId}`)
  })

  const handleCreate = (quizzId: string) => {
    socket?.emit("game:create", quizzId)
  }

  if (!isAuth) {
    return (
      <div className="flex w-full items-center justify-center p-8 text-xl font-bold">
        جاري التحميل...
      </div>
    )
  }

  return <SelectQuizz quizzList={quizzList} onSelect={handleCreate} />
}

export default ManagerAuthPage
