//@ts-nocheck
import { AppLayout, Box, Button, Cards, Container, ContentLayout, Grid, Header, Link, SegmentedControl, SpaceBetween, Tabs, TopNavigation, Wizard } from "@cloudscape-design/components";
import { useEffect, useState } from "react";

function App() {
  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const [selectedId, setSelectedId] = useState("male")

  const initializeCamera = () => {
    const video = document.getElementById('camera-feed');
    navigator.mediaDevices.getUserMedia({ video: true })
      .then((stream) => {
        video.srcObject = stream;
        video.play();
      })
      .catch((err) => {
        console.error('Error accessing camera:', err);
      });
  }

  const capturePhoto = () => {
    const video = document.getElementById('camera-feed');
    const canvas = document.getElementById('camera-canvas');
    const context = canvas.getContext('2d');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataURL = canvas.toDataURL('image/jpeg');
    console.log(dataURL);
  }

  useEffect(() => {
    if(activeStepIndex == 0)
      initializeCamera()
  })


  return (
    <>
      <div id="custom-main-header">
        <TopNavigation
          identity={{
            href: '#',
            title: "Virtual Fashion Assistant",
          }}
        />
      </div>
      <AppLayout
        disableContentPaddings
        headerSelector='#custom-main-header'
        toolsHide={true}
        navigationHide={true}
        content={
          <ContentLayout
            defaultPadding
            headerVariant="high-contrast"
            header={
              <Header
                variant="h1"
                description={"Your virtual assistant for Fashion"}
              > Virtual Fashion Assistant
              </Header>
            }
          ><Container fitHeight>
              <Wizard
                  i18nStrings={{
                    stepNumberLabel: stepNumber =>
                      `Step ${stepNumber}`,
                    collapsedStepsLabel: (stepNumber, stepsCount) =>
                      `Step ${stepNumber} of ${stepsCount}`,
                    skipToButtonLabel: (step, stepNumber) =>
                      `Skip to ${step.title}`,
                    navigationAriaLabel: "Steps",
                    cancelButton: "Cancel",
                    previousButton: "Previous",
                    nextButton: "Next",
                    submitButton: "Generate Images",
                    optional: "optional"
                  }}
                  onNavigate={({ detail }) => {
                      setActiveStepIndex(detail.requestedStepIndex);
                    }
                  }
                  activeStepIndex={activeStepIndex}
                  steps={[
                    {
                      title: "Click a Photo",
                      description: "",
                      content: (
                        <Container fitHeight>
                          <SpaceBetween size="l" alignItems="center">
                            <video id="camera-feed" autoPlay></video>
                            <Button variant="primary" onClick={() => { capturePhoto() }}>Take a Photo</Button>
                            <canvas id="camera-canvas" style={{ width: "100px"}}></canvas>
                          </SpaceBetween>

                        </Container>
                      )
                    },
                    {
                      title: "Choose Garment",
                      content: (
                        <Container fitHeight>
                          <SpaceBetween size="l" alignItems="center">
                            <SegmentedControl selectedId={selectedId}
                              onChange={({ detail }) =>
                                setSelectedId(detail.selectedId)
                              }
                              label="Default segmented control"
                              options={[
                                { text: "Male", id: "male" },
                                { text: "Female", id: "female" },
                              ]}
                            />

                            <Cards
                              ariaLabels={{
                                itemSelectionLabel: (e, t) => `select ${t.name}`,
                                selectionGroupLabel: "Item selection"
                              }}
                              cardDefinition={{
                                header: item => (
                                  <Link href="#" fontSize="heading-m">
                                    {item.name}
                                  </Link>
                                ),
                                sections: [
                                  {
                                    id: "description",
                                    header: "Description",
                                    content: item => item.description
                                  },
                                  {
                                    id: "type",
                                    header: "Type",
                                    content: item => item.type
                                  },
                                  {
                                    id: "size",
                                    header: "Size",
                                    content: item => item.size
                                  }
                                ]
                              }}
                              cardsPerRow={[
                                { cards: 1 },
                                { minWidth: 300, cards: 3 }
                              ]}
                              items={[
                                {
                                  name: "Item 1",
                                  alt: "First",
                                  description: "This is the first item",
                                  type: "1A",
                                  size: "Small"
                                },
                                {
                                  name: "Item 2",
                                  alt: "Second",
                                  description: "This is the second item",
                                  type: "1B",
                                  size: "Large"
                                },
                                {
                                  name: "Item 3",
                                  alt: "Third",
                                  description: "This is the third item",
                                  type: "1A",
                                  size: "Large"
                                },
                                {
                                  name: "Item 4",
                                  alt: "Fourth",
                                  description: "This is the fourth item",
                                  type: "2A",
                                  size: "Small"
                                },
                                {
                                  name: "Item 5",
                                  alt: "Fifth",
                                  description: "This is the fifth item",
                                  type: "2A",
                                  size: "Large"
                                },
                                {
                                  name: "Item 6",
                                  alt: "Sixth",
                                  description: "This is the sixth item",
                                  type: "1A",
                                  size: "Small"
                                }
                              ]}
                              loadingText="Loading resources"
                              empty={
                                <Box
                                  margin={{ vertical: "xs" }}
                                  textAlign="center"
                                  color="inherit"
                                >
                                  <SpaceBetween size="m">
                                    <b>No resources</b>
                                    <Button>Create resource</Button>
                                  </SpaceBetween>
                                </Box>
                              }
                            />
                          </SpaceBetween>
                        </Container>
                      ),
                    }
                  ]}
                />
            </Container>
          </ContentLayout>
        }
      />
    </>
  );
}

export default App;
