import { AppLayout, Container, ContentLayout, Header, TopNavigation } from "@cloudscape-design/components";
import { Authenticator } from "@aws-amplify/ui-react";
import { Routes, Route, HashRouter } from 'react-router-dom';
import { withInAppMessaging } from '@aws-amplify/ui-react-notifications';
import Home from "./pages/Home";
import Register from "./pages/Register";
import Fashion from "./pages/Fashion";
const Router = HashRouter;

function App() {
  return (
    <Authenticator hideSignUp={true}>
      {({ signOut, user }) => (
        <>
          <div id="custom-main-header">
            <TopNavigation
              identity={{
                href: '#',
                title: "Virtual Fashion Assistant",
              }}

              utilities={[

                {
                  type: "menu-dropdown",
                  text: "",
                  description: user?.signInDetails?.loginId,
                  iconName: "user-profile",
                  items: [
                    { id: "signout", text: "Sign out" }
                  ],
                  onItemClick: (item) => {
                    console.log(item);
                    if (item.detail.id === "signout") {
                      console.log("signing out", user);
                      // @ts-ignore
                      signOut();
                    }
                  }
                }
              ]}
            />
          </div>
          <AppLayout
            disableContentPaddings
            headerSelector='#custom-main-header'
            toolsHide={true}
            navigationHide={true}
            content={
              <ContentLayout
                data-class="custom-layout"
                defaultPadding
                headerVariant="high-contrast"
                header={
                  <Header
                    variant="h1"
                    description={"Your virtual assistant for Fashion"}
                  > Virtual Fashion Assistant
                  </Header>
                }
              ><Container fitHeight data-class="custom-content-layout">
                  <Router>
                    <Routes>
                      <Route path="/" element={<Home />} />
                      <Route path="/registration" element={<Register />} />
                      <Route path="/fashion" element={<Fashion />} />
                    </Routes>
                  </Router>
                </Container>
              </ContentLayout>
            }
          />
        </>

      )}
    </Authenticator>
  );
}

export default withInAppMessaging(App);