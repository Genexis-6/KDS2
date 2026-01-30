
import { useEffect } from "react";
import { GlobalNotification } from "./common/component/notification";
import MainRoute from "./common/routes/main_routes";
import { useIsAuthenticatedStore } from "./utils/hooks/use_is_authenticated_store";
import PopupMenu from "./common/component/PopUpMenu";





function App() {

  const {
 checkIsAuthenticated
  } = useIsAuthenticatedStore()

  useEffect(
    () => {
      checkIsAuthenticated()

    }, []
  )

  return (
    <>
      <GlobalNotification />
      <MainRoute />
      <PopupMenu />
    </>
  );
}

export default App;
