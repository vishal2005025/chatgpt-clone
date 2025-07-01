//normal code

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





//hydrate code

// "use client";

// import { userAuthStore } from "@/store/authStore";
// import { usePathname, useRouter } from "next/navigation";
// import React, { useEffect, useState } from "react";
// import { Loader } from "../Loader";

// const publicRoute = ["/sign-in", "/sign-up"];

// export default function AuthProvider({ children }: { children: React.ReactNode }) {
//   const { isAuthenticated, isLoading, userProfile, user } = userAuthStore();
//   const pathname = usePathname();
//   const router = useRouter();
//   const [hydrated, setHydrated] = useState(false);

//   // Wait until store is hydrated before rendering
//   useEffect(() => {
//     setHydrated(true);
//   }, []);

//   useEffect(() => {
//     if (hydrated && !publicRoute.includes(pathname)) {
//       userProfile();
//     }
//   }, [hydrated, pathname, userProfile]);

//   useEffect(() => {
//     if (!isLoading && hydrated) {
//       const isPublic = publicRoute.includes(pathname);
//       if (!isAuthenticated && !isPublic) {
//         router.push("/sign-in");
//       }
//       if (isAuthenticated && isPublic) {
//         router.push("/");
//       }
//     }
//   }, [isAuthenticated, isLoading, pathname, router, hydrated]);

//   if (!hydrated || isLoading) {
//     return <Loader type="default" position="center" />;
//   }

//   return <>{children}</>;
// }



//code to remove middleware 



"use client";

import { userAuthStore } from "@/store/authStore";
import { usePathname, useRouter } from "next/navigation";
import React, { useEffect } from "react";
import { Loader } from "../Loader";

const publicRoutes = ["/sign-in", "/sign-up"];

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, userProfile } = userAuthStore();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    // Only fetch profile if not on a public route
    if (!publicRoutes.includes(pathname)) {
      userProfile();
    }
  }, [pathname, userProfile]);

  useEffect(() => {
    if (!isLoading) {
      const isPublic = publicRoutes.includes(pathname);

      // If not authenticated and trying to access private route, redirect to login
      if (!isAuthenticated && !isPublic) {
        router.replace("/sign-in");
      }

      // If authenticated and trying to access public routes like /sign-in, redirect to home
      if (isAuthenticated && isPublic) {
        router.replace("/");
      }
    }
  }, [isAuthenticated, isLoading, pathname, router]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader type="default" position="center" />
      </div>
    );
  }

  return <>{children}</>;
}
