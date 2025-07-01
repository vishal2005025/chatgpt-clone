// 'use client'
// import { Loader } from "@/components/Loader";
// import { userAuthStore } from "@/store/authStore";
// import { useRouter, useSearchParams } from "next/navigation";
// import { useEffect } from "react";




// export default function SuccessLogin () {
//     const router = useRouter() ;
//     const searchParams = useSearchParams();
//     const token = searchParams.get('token');

//     const {userProfile} = userAuthStore();

//     useEffect(() => {
//         if(token){
//             userProfile().then(() => {
//                 router.push('/')
//             })
//         }else{
//             router.push('/sign-in')
//         }
//     },[token,userProfile,router])


//     return(
//         <div className="flex h-screen items-center justify-center">
//             <Loader type="default" position="center"/>
//         </div>
//     )

// }




//with time out and attempts

//backend shifts to frontend no need 

// 'use client';
// import { Loader } from "@/components/Loader";
// import { userAuthStore } from "@/store/authStore";
// import { useRouter, useSearchParams } from "next/navigation";
// import { useEffect, useState } from "react";

// export default function SuccessLogin() {
//   const router = useRouter();
//   const searchParams = useSearchParams();
//   const token = searchParams.get("token");

//   const { userProfile } = userAuthStore();
//   const [attempts, setAttempts] = useState(0);
//  const maxAttempts = 50;

//   useEffect(() => {
//     if (!token) {
//       router.push("/sign-in");
//       return;
//     }

//     const interval = setInterval(() => {
//       const hasAuthToken = document.cookie
//         .split("; ")
//         .some((cookie) => cookie.startsWith("auth_token="));

//       if (hasAuthToken) {
//         clearInterval(interval);
//         userProfile().then(() => router.push("/"));
//       } else if (attempts >= maxAttempts) {
//         clearInterval(interval);
//         router.push("/sign-in"); // fallback if auth_token never appears
//       } else {
//         setAttempts((prev) => prev + 1);
//       }
//     }, 2000);

//     return () => clearInterval(interval);
//   }, [token, userProfile, router, attempts]);

//   return (
//     <div className="flex h-screen items-center justify-center">
//       <Loader type="default" position="center" />
//     </div>
//   );
// }
