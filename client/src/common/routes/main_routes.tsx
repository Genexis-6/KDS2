
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { NavigationSync } from "../component/navigation_sync";
import { AppUrl } from "./app_urls";
import Login from "../../features/auth/view/pages/Login";
import NavbarLayout from "../component/NavBarLayout";
import ExamSelection from "../../features/dashboard/students/view/pages/ExamSelection";
import ProtectedRoute from "../component/ProtectedRoutes";
import ExamPreParation from "../../features/dashboard/students/view/pages/ExamPreparation";
import ExamScreen from "../../features/dashboard/students/view/pages/ExamScreen";
import AdminDashBoard from "../../features/dashboard/admin/view/pages/AdminDashBoard";
import ViewParticularClass from "../../features/dashboard/admin/view/pages/ViewParticularClass";
import ViewParticularClassSubjects from "../../features/dashboard/admin/view/pages/ViewParticularClassSubjects";
import AddNewSubject from "../../features/dashboard/admin/view/pages/AddNewClass";
import ViewParticularSubject from "../../features/dashboard/admin/view/pages/ViewParticularSubject";

export default function MainRoute() {
    return <>

        <BrowserRouter>
            <NavigationSync />
            <Routes >
                <Route path={AppUrl.login} element={<Login />} />

                <Route element={<ProtectedRoute />}>
                    <Route element={<NavbarLayout />}>
                        <Route path={AppUrl.examSelectionUrl} element={<ExamSelection />} />
                        <Route path={AppUrl.examPreparation} element={<ExamPreParation />} />
                        <Route path={AppUrl.startExam} element={<ExamScreen />} />


                        <Route path={AppUrl.adminPath}>
                        <Route index element={<AdminDashBoard/>}/>
                        <Route path={AppUrl.viewParticularClass} element={<ViewParticularClass/>}/>
                        <Route path={AppUrl.viewParticularClassSubject} element={<ViewParticularClassSubjects/>}/>
                        <Route path={AppUrl.addNewSubject} element={<AddNewSubject/>}/>
                        <Route path={AppUrl.viewParticularSubject} element={<ViewParticularSubject/>}/>
                        </Route>

                    </Route>
                </Route>
            </Routes>


        </BrowserRouter>
    </>
}