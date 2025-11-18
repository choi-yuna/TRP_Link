// 전역 타입 보강: Axios 요청 옵션에 skipAuthRedirect 허용
import "axios";

declare module "axios" {
  // 런타임에 인터셉터가 읽는 내부 타입
  export interface InternalAxiosRequestConfig<D = any> {
    skipAuthRedirect?: boolean;
  }
  // 호출부에서 넘기는 일반 옵션 타입
  export interface AxiosRequestConfig<D = any> {
    skipAuthRedirect?: boolean;
  }
}
