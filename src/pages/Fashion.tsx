//@ts-nocheck
import { Alert, Box, BreadcrumbGroup, Button, Cards, Container, SegmentedControl, SpaceBetween, Wizard } from "@cloudscape-design/components";
import { useEffect, useState } from "react";
import { garmentList } from "../common";

export default function Fashion() {
    const [activeStepIndex, setActiveStepIndex] = useState(0);
    const [imagecount, setImagecount] = useState(1);
    const [showalert, setShowalert] = useState(false);
    const [selectedImage, setSelectedimage] = useState(null);
    const [selectedId, setSelectedId] = useState("male");

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
        setImagecount(1);
        setSelectedimage(null);
        setShowalert(false);
    }

    const stopCameraStreaming = () => {
        const video = document.getElementById('camera-feed');
        const stream = video.srcObject;
        if (stream) {
            const tracks = stream.getTracks();
            tracks.forEach((track) => track.stop());
            video.srcObject = null;
        }
    }

    const clearAllCanvas = () => {
        for (let i = 1; i <= 5; i++) {
            const canvas = document.getElementById(`camera-canvas${i}`);
            const context = canvas.getContext('2d');
            context.clearRect(0, 0, canvas.width, canvas.height);
            canvas.classList.remove("canvas-photo-selected");
            canvas.classList.remove("canvas-photo");
            canvas.classList.add("canvas-photo-hidden");
        }
        setImagecount(1);
        setSelectedimage(null);
        setShowalert(false);
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

    useEffect(() => {
        setImagecount(1);
        if (activeStepIndex == 1)
            initializeCamera()
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
            submitButton: "Sumbit for Generation",
            optional: "optional"
        }}

        onCancel={() => {
            setActiveStepIndex(0);
            clearAllCanvas();
        }}

        onNavigate={({ detail }) => {
            if(detail.requestedStepIndex == 1){
                console.log(detail.requestedStepIndex)
            }
            else if (detail.requestedStepIndex == 2 && selectedImage == null) {
                setShowalert(true)
            } else {
                if (detail.requestedStepIndex !== 1) {
                    stopCameraStreaming()
                }
                setActiveStepIndex(detail.requestedStepIndex);
            }
        }
        }
        activeStepIndex={activeStepIndex}
        steps={[
            {
                title: "Select Id",
                description: "",
                content: (
                    <Container fitHeight>
                        <SpaceBetween size="l" alignItems="center">
                            <Box color="text-body-secondary">Select an Id to proceed</Box>
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
                                (imagecount > 1) && (
                                    <Box color="text-body-secondary">Select a image to proceed</Box>
                                )
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
                                items={garmentList.filter(e => e.gender == selectedId)}
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