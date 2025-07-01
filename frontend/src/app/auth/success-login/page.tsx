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





'use client';
import { Loader } from "@/components/Loader";
import { userAuthStore } from "@/store/authStore";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";

export default function SuccessLogin() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const { userProfile } = userAuthStore();

  useEffect(() => {
    if (!token) {
      router.push("/sign-in");
      return;
    }

    // Poll every 200ms until auth_token is present in browser cookies
    const interval = setInterval(() => {
      const hasAuthToken = document.cookie
        .split("; ")
        .some((cookie) => cookie.trim().startsWith("auth_token="));
        
      if (hasAuthToken) {
        clearInterval(interval);
        userProfile().then(() => {
          router.push("/");
        });
      }
    }, 200);

    return () => clearInterval(interval);
  }, [token, userProfile, router]);

  return (
    <div className="flex h-screen items-center justify-center">
      <Loader type="default" position="center" />
    </div>
  );
}
