//@ts-nocheck
import { Alert, Box, BreadcrumbGroup, Button, Cards, Container, FormField, Header, Input, SegmentedControl, SpaceBetween, Wizard } from "@cloudscape-design/components";
import { useEffect, useState } from "react";
import { garmentList } from "../common";
import { AppApi } from "../common/AppApi";
import { AppUtility } from "../common/Util";
import { uploadData } from 'aws-amplify/storage';

let VIDEO_STREAM = null;

export default function Fashion() {
    const [activeStepIndex, setActiveStepIndex] = useState(0);
    const [inputValue, setInputValue] = useState("");
    const [user, setUser] = useState(null);
    const [imagecount, setImagecount] = useState(1);
    const [showalert, setShowalert] = useState(false);
    const [selectedImage, setSelectedimage] = useState(null);
    const [selectedGender, setSelectedGender] = useState(null);
    const [gender, setGender] = useState(null);
    const [isLoadingNext, setIsLoadingNext] = useState(false);

    const initializeCamera = () => {
        const video = document.getElementById('camera-feed');
        navigator.mediaDevices.getUserMedia({ video: true })
            .then((stream) => {
                VIDEO_STREAM = stream
                video.srcObject = VIDEO_STREAM;
                video.play();
            })
            .catch((err) => {
                console.error('Error accessing camera:', err);
            });
        setImagecount(1);
        setSelectedimage(null);
        setShowalert(false);
    }
    const stopCameraStreaming = () => {
        try {
            if (VIDEO_STREAM) {
                const tracks = VIDEO_STREAM.getTracks();
                tracks.forEach((track) => track.stop());
            }
        } catch (e) {
            console.log(e)
        }
    }
    const clearAllCanvas = () => {
        for (let i = 1; i <= 5; i++) {
            try {
                const canvas = document.getElementById(`camera-canvas${i}`);
                const context = canvas.getContext('2d');
                context.clearRect(0, 0, canvas.width, canvas.height);
                canvas.classList.remove("canvas-photo-selected");
                canvas.classList.remove("canvas-photo");
                canvas.classList.add("canvas-photo-hidden");
            } catch (e) {
                console.log(e)
            }

        }
        setImagecount(1);
        setSelectedimage(null);
        setShowalert(false);
        selectedGender(null);
        setGender(null);
        setIsLoadingNext(false);
    }
    const capturePhoto = () => {
        let counter = imagecount;
        const video = document.getElementById('camera-feed');
        const canvas = document.getElementById(`camera-canvas${counter}`);
        const context = canvas.getContext('2d');
        canvas.classList.remove("canvas-photo-hidden");
        canvas.classList.add("canvas-photo");
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        counter++;
        setImagecount(counter);
        setShowalert(false);
    }
    const selectCanvasImage = (detail) => {
        const canvas = document.getElementById(detail.target.id);
        const dataUrl = canvas.toDataURL();
        // reset all canvas css
        for (let i = 1; i <= 5; i++) {
            const tempcanvas = document.getElementById(`camera-canvas${i}`);
            // remove css
            tempcanvas.classList.remove("canvas-photo-selected");
            tempcanvas.classList.remove("canvas-photo");
            if (detail.target.id == `camera-canvas${i}`) {
                tempcanvas.classList.add("canvas-photo-selected");
            } else {
                tempcanvas.classList.add("canvas-photo");
            }

        }
        // on selected disable hover effect
        canvas.classList.add("canvas-photo-selected");
        setSelectedimage(dataUrl);
        setShowalert(false);
    }
    const submitPhoto = async (nextStep) => {
        setIsLoadingNext(true);
        const ai_response = await AppApi.aiOperation(selectedImage);
        const model_response = ai_response.response.output.message.content[0]
        const result = model_response.text.replace(/\n/g, "").replace("json", "").replace(/`/g, "");
        const output = JSON.parse(result);
        setGender(output)
        setSelectedGender(output.gender)
        const file_upload_result = await uploadData({
            path: `raw/${user.user_id}/${AppUtility.fileName()}`,
            data: AppUtility.base64ToBlob(selectedImage, 'image/png'),
        });
        setIsLoadingNext(false);
        stopCameraStreaming()
        setActiveStepIndex(nextStep);
    }
    const registerUser = async (nextStep) => {
        if (inputValue != "") {
            setIsLoadingNext(true);
            const userId = AppUtility.guid()
            const newUser = {
                "email": inputValue,
                "user_id": userId,
                "process_state": "Registered",
                "selected_image": "",
                "create_on": new Date().toISOString(),
                "update_on": new Date().toISOString(),
            }
            const payload = {
                "action": "ADD_USER",
                "data": newUser
            }
            await AppApi.dbPostOperation(payload);
            setUser(newUser)
            setIsLoadingNext(false);
            setActiveStepIndex(nextStep);
        }
    }

    const controlNavigation = (detail) => {
        if (detail.requestedStepIndex == 1) {
            registerUser(detail.requestedStepIndex);
        }
        else if (detail.requestedStepIndex == 2) {
            if (selectedImage == null)
                setShowalert(true)
            else {
                submitPhoto(detail.requestedStepIndex)
            }
        } else {
            stopCameraStreaming();
            setActiveStepIndex(detail.requestedStepIndex);
        }
    }
    useEffect(() => {
        setImagecount(1);
        if (activeStepIndex == 1)
            initializeCamera()
        else
            stopCameraStreaming()

        return () => {
            stopCameraStreaming()
        }
    }, [activeStepIndex])

    return (<Container fitHeight header={
        <BreadcrumbGroup
            items={[
                { text: "Home", href: "#" },
                { text: "Try Out", href: "#/fashion" },
            ]}
        />
    }>
        <Wizard
            isLoadingNextStep={isLoadingNext}
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
                submitButton: "Submit for Generation",
                optional: "optional"
            }}

            onCancel={() => {
                setActiveStepIndex(0);
                clearAllCanvas();
            }}

            onNavigate={({ detail }) => { controlNavigation(detail) }
            }
            activeStepIndex={activeStepIndex}
            steps={[
                {
                    title: "Participant Registration",
                    description: "",
                    content: (
                        <Container fitHeight>
                            <SpaceBetween size="l">
                                <FormField
                                    description="Provide participant's email id"
                                    label="Email"
                                >
                                    <Input
                                        placeholder="Enter email id"
                                        type="email"
                                        value={inputValue}
                                        onChange={event =>
                                            setInputValue(event.detail.value)
                                        }
                                    />
                                </FormField>
                            </SpaceBetween>
                        </Container>
                    )
                },
                {
                    title: "Click a Photo",
                    description: "",
                    content: (
                        <Container fitHeight>
                            <SpaceBetween size="l" alignItems="center">
                                <video id="camera-feed" playsInline></video>
                                <SpaceBetween size="l" direction="horizontal">
                                    <Button variant="primary" onClick={() => { capturePhoto() }} disabled={(imagecount > 5)}>Take a Photo</Button>
                                    <Button iconName="refresh" onClick={() => { clearAllCanvas() }} disabled={(imagecount <= 1)}>Clear Photo(s)</Button>
                                </SpaceBetween>

                                <SpaceBetween direction="horizontal" size="xl">
                                    <canvas id="camera-canvas1" className="canvas-photo-hidden" onClick={(detail) => { selectCanvasImage(detail) }}></canvas>
                                    <canvas id="camera-canvas2" className="canvas-photo-hidden" onClick={(detail) => { selectCanvasImage(detail) }}></canvas>
                                    <canvas id="camera-canvas3" className="canvas-photo-hidden" onClick={(detail) => { selectCanvasImage(detail) }}></canvas>
                                    <canvas id="camera-canvas4" className="canvas-photo-hidden" onClick={(detail) => { selectCanvasImage(detail) }}></canvas>
                                    <canvas id="camera-canvas5" className="canvas-photo-hidden" onClick={(detail) => { selectCanvasImage(detail) }}></canvas>
                                </SpaceBetween>

                                {
                                    (imagecount > 1) && <Box color="text-body-secondary">Select a image to proceed</Box>
                                }
                                <Alert statusIconAriaLabel="Info" visible={showalert}> Select an image to proceed </Alert>
                            </SpaceBetween>

                        </Container>
                    )
                },
                {
                    title: "Choose Garment",
                    content: (
                        <Container fitHeight>
                            <SpaceBetween size="l" alignItems="center">
                                <SegmentedControl selectedId={selectedGender}
                                    label="Default segmented control"
                                    options={[
                                        { text: "Male", id: "male" },
                                        { text: "Female", id: "female", },
                                    ]}
                                />
                                <pre>{JSON.stringify(gender)}</pre>
                                <pre>{JSON.stringify(user)}</pre>
                                <Cards
                                    ariaLabels={{
                                        itemSelectionLabel: (e, t) => `select ${t.name}`,
                                        selectionGroupLabel: "Item selection"
                                    }}
                                    cardDefinition={{
                                        sections: [
                                            {
                                                id: "image_id",
                                                content: item => (<img src={`./garments/${item.image_id}`} width="100%" />),

                                            },
                                        ]
                                    }}
                                    cardsPerRow={[
                                        { cards: 1 },
                                        { minWidth: 300, cards: 3 }
                                    ]}
                                    items={garmentList.filter(e => e.gender == selectedGender)}
                                    loadingText="Loading resources"
                                />
                            </SpaceBetween>
                        </Container>
                    ),
                }
            ]}
        />
    </Container>)
}