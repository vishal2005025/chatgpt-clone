// "use client"
// import { userAuthStore } from "@/store/authStore";
// import { usePathname, useRouter } from "next/navigation";
// import React, { useEffect } from "react";
// import { Loader } from "../Loader";


// const publicRoute = ["/sign-in", "/sign-up"]


// export default function AuthProvider({children}:{children:React.ReactNode}) {
//     const {isAuthenticated,isLoading,userProfile,user} = userAuthStore();
//     const pathname = usePathname();
//     const router = useRouter();


// console.log(user)
//     useEffect(() => {
//         if(!publicRoute.includes(pathname)){
//             userProfile()
//         }
//     },[userProfile,pathname])

//     useEffect(() => {
//         if(!isLoading) {
//             const isPublic = publicRoute.includes(pathname)
//             if(!isAuthenticated && !isPublic ){
//                 router.push('/sign-in')
//             }
//             if(isAuthenticated && isPublic){
//                 router.push('/')
//             }
//         }
        
//     },[isAuthenticated,isLoading,pathname,router])



//     if(isLoading){
//         return <Loader type="default" position="center"/>
//     }
//     return <>{children}</>
// }




"use client";

import { userAuthStore } from "@/store/authStore";
import { usePathname, useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import { Loader } from "../Loader";

const publicRoute = ["/sign-in", "/sign-up"];

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, userProfile, user } = userAuthStore();
  const pathname = usePathname();
  const router = useRouter();
  const [hydrated, setHydrated] = useState(false);

  // Wait until store is hydrated before rendering
  useEffect(() => {
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated && !publicRoute.includes(pathname)) {
      userProfile();
    }
  }, [hydrated, pathname, userProfile]);

  useEffect(() => {
    if (!isLoading && hydrated) {
      const isPublic = publicRoute.includes(pathname);
      if (!isAuthenticated && !isPublic) {
        router.push("/sign-in");
      }
      if (isAuthenticated && isPublic) {
        router.push("/");
      }
    }
  }, [isAuthenticated, isLoading, pathname, router, hydrated]);

  if (!hydrated || isLoading) {
    return <Loader type="default" position="center" />;
  }

  return <>{children}</>;
}
