/* eslint-disable react-hooks/static-components */
/* eslint-disable no-unused-vars */
import React, { useEffect } from 'react'
import { Routes, Route } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import Home from './pages/Home'
import { RedirectToSignIn, SignedIn, SignedOut, useAuth } from "@clerk/clerk-react";
import { setTokenGetter } from './api/axiosConfig.js';
import AppShell from './components/AppShell';
import DashBoard from './pages/DashBoard';
import CreateInvoice from './pages/CreateInvoice';
import Invoices from './pages/Invoices';
import InvoicePreview from './components/InvoicePreview';
import BusinessProfile from './pages/BusinessProfile';
import NotFound from './pages/NotFound';

function AuthAxiosSetup() {
  const { getToken } = useAuth();
  useEffect(() => {
    if (typeof getToken !== "function") return;
    setTokenGetter(async () => {
      let token = await getToken({ template: "default" }).catch(() => null);
      if (!token) token = await getToken({ forceRefresh: true }).catch(() => null);
      return token;
    });
  }, [getToken]);
  return null;
}

const App = () => {
  const ClerkedProtected = ({children}) =>(
    <>
    <SignedIn>{children}</SignedIn>
    <SignedOut>
      <RedirectToSignIn/>
    </SignedOut>
    </>
  )
  return (
    <div className='min-h-screen max-w-full overflow-x-hidden'>
      <Toaster position="top-center" toastOptions={{ duration: 3000 }} />
      <AuthAxiosSetup />
       <Routes>
      <Route path='/' element = {<Home />}/>
      {/* it must be protected route */}
      <Route path='/app' element = {<ClerkedProtected><AppShell/></ClerkedProtected>}>
      <Route index element = {<DashBoard/>}/>
      <Route path='dashboard' element = {<DashBoard/>}/>
      <Route path='invoices' element = {<Invoices/>}/>
      <Route path='invoices/new' element = {<CreateInvoice/>}/>
      <Route path='invoices/:id' element = {<InvoicePreview/>}/>
      <Route path='invoices/:id/preview' element = {<InvoicePreview/>}/>
      <Route path='invoices/:id/edit' element = {<CreateInvoice/>}/>

      <Route path='create-invoice' element = {<CreateInvoice/>}/>
      <Route path='business' element={<BusinessProfile/>}/>
      </Route>

      <Route path='*' element= {<NotFound/>}/>
    </Routes>
    </div>
   
  )
}

export default App 