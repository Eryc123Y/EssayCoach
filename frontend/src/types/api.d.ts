declare namespace Api {
  namespace Auth {
    interface LoginToken {
      token: string;
      refreshToken: string;
      expiresIn: number;
    }
    interface UserInfo {
      id: string;
      username: string;
      name: string;
      avatar?: string;
      email: string;
      role: string;
    }
  }
  namespace Route {
    interface MenuRoute {
      path: string;
      name: string;
      component?: string;
      meta?: {
        title: string;
        icon?: string;
      };
      children?: MenuRoute[];
    }
    interface UserRoute {
      home: string;
      routes: MenuRoute[];
    }
  }
}
