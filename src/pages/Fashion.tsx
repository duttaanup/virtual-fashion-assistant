//@ts-nocheck
import { Alert, Box, BreadcrumbGroup, Button, Cards, Container, FormField, Input, Modal, SegmentedControl, SpaceBetween, Wizard } from "@cloudscape-design/components";
import { useEffect, useState } from "react";
import { enable, record } from 'aws-amplify/analytics';
import { syncMessages, } from 'aws-amplify/in-app-messaging';
import { AppApi } from "../common/AppApi";
import { AppUtility, ProcessActionEnum, ProcessActionTypeEnum, UserStateEnum, garmentListFn } from "../common/Util";
import { uploadData } from 'aws-amplify/storage';
import { StorageImage } from "@aws-amplify/ui-react-storage";
import outputs from "../../amplify_outputs.json";
import QRCode from "react-qr-code";

let VIDEO_STREAM = null;
const bucketName = outputs.storage.bucket_name;
const garmentList = garmentListFn();

function Fashion() {
    const [activeStepIndex, setActiveStepIndex] = useState(0);
    const [inputValue, setInputValue] = useState("");
    const [userId, setUserId] = useState("");
    const [user, setUser] = useState(null);
    const [imagecount, setImagecount] = useState(1);
    const [showalert, setShowalert] = useState(false);
    const [selectedImage, setSelectedimage] = useState(null);
    const [selectedImageBase64, setSelectedImageBase64] = useState(null);
    const [selectedGender, setSelectedGender] = useState(null);
    const [gender, setGender] = useState(null);
    const [isLoadingNext, setIsLoadingNext] = useState(false);
    const [selectedItems, setSelectedItems] = useState([]);
    const [cameraOrientation, setCameraOrientation] = useState('portrait');
    const [cameraRotation, setCameraRotation] = useState('Right');
    const [showAck, setShowAck] = useState(false)
    const [qrurl, setQrurl] = useState("")

    const initializeCamera = () => {
        const video = document.getElementById('camera-feed');
        navigator.mediaDevices.getUserMedia({
            video: true,
            width: { ideal: 4096 },
            height: { ideal: 2160 },
        })
            .then((stream) => {
                VIDEO_STREAM = stream
                const track = VIDEO_STREAM.getVideoTracks()[0];
                if ('ImageCapture' in window) {
                    const imageCapture = new ImageCapture(track);
                    const imgBlob = imageCapture.takePhoto();
                    imgBlob.then(() => {
                        console.log("Camera ready")
                        video.srcObject = VIDEO_STREAM;
                        video.play();
                    })
                } else {
                    console.log("ImageCapture API not supported")
                    video.srcObject = VIDEO_STREAM;
                    video.play();
                }

            })
            .catch((err) => {
                console.error('Error accessing camera:', err);
            });
        setImagecount(1);
        setSelectedimage(null);
        setShowalert(false);
        setSelectedGender(null)
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

                const img = document.getElementById(`camera-img-${i}`);
                img.src = "";
            } catch (e) {
                console.log(e)
            }

        }
        setImagecount(1);
        setSelectedimage(null);
        setShowalert(false);;
        setGender(null);
        setIsLoadingNext(false);
    }
    const capturePhoto = async () => {
        let counter = imagecount;
        const video = document.getElementById('camera-feed');
        const canvas = document.getElementById(`camera-canvas${counter}`);
        const img = document.getElementById(`camera-img-${counter}`);
        const imgcanvas = document.createElement('canvas');
        const rotationFactor = (cameraRotation == 'Left') ? -1 : 1;

        canvas.classList.remove("canvas-photo-hidden");
        canvas.classList.add("canvas-photo");

        let outputHeight = 0;
        let outputWidth = 0;
        if(cameraOrientation == 'landscape'){
            outputHeight = video.videoHeight
            outputWidth = video.videoWidth
        }else{
            outputHeight = video.videoWidth
            outputWidth = video.videoHeight
        }
        
        canvas.width = outputWidth;
        canvas.height = outputHeight;
        imgcanvas.width = outputWidth;
        imgcanvas.height = outputHeight;

        const ctx = canvas.getContext('2d');
        const imgcontext = imgcanvas.getContext('2d');

        
        if (cameraOrientation == 'landscape') {
            ctx.drawImage(video, 0, 0, outputWidth, outputHeight);
            imgcontext.drawImage(video, 0, 0, outputWidth, outputHeight);
        } else {
            ctx.clearRect(0, 0, outputWidth, outputHeight);
            ctx.save();
            ctx.translate(outputWidth / 2, outputHeight / 2,);
            ctx.rotate(rotationFactor * Math.PI / 2);
            if(rotationFactor === -1)
                ctx.drawImage(video, rotationFactor * outputHeight / 2, rotationFactor * outputWidth / 2);
            else
                ctx.drawImage(video, -rotationFactor * outputHeight / 2, -rotationFactor * outputWidth / 2);

            ctx.restore();

            imgcontext.clearRect(0, 0, outputWidth, outputHeight);
            imgcontext.save();
            imgcontext.translate(outputWidth / 2, outputHeight / 2);
            imgcontext.rotate(rotationFactor * Math.PI / 2);
            if(rotationFactor === -1)
                imgcontext.drawImage(video, rotationFactor * outputHeight / 2, rotationFactor * outputWidth / 2);
            else
                imgcontext.drawImage(video, -rotationFactor * outputHeight / 2, -rotationFactor * outputWidth / 2);
            imgcontext.restore();
        }

        const data = imgcanvas.toDataURL("image/jpeg");
        img.src = data;

        counter++;
        setImagecount(counter);
        setShowalert(false);
        record({ name: 'capturePhoto' })
    }
    const selectCanvasImage = (detail) => {
        const canvas = document.getElementById(detail.target.id);
        const number = detail.target.id.match(/\d+/)[0];
        const img = document.getElementById(`camera-img-${number}`)
        setSelectedImageBase64(img.src)
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
    const submitPhoto = async () => {
        // Gender Detection
        const ai_response = await AppApi.aiOperation(selectedImage);
        const model_response = ai_response?.response?.output.message.content[0]
        const result = model_response.text.replace(/\n/g, "").replace("json", "").replace(/`/g, "");
        const output = JSON.parse(result);
        setGender(output)
        setSelectedGender(output.gender)
        const uploadFilePath = `raw/${user.user_id}/${AppUtility.fileName()}`;
        await uploadData({
            path: uploadFilePath,
            data: AppUtility.dataURLtoBlob(selectedImageBase64),
        });
        let tempUser = user;
        tempUser.selected_image = uploadFilePath;
        tempUser.gender = output;
        tempUser.process_state = UserStateEnum.IMAGE_SELECTED;
        tempUser.update_on = new Date().toISOString();
        await AppApi.dbPostOperation({
            "action": ProcessActionEnum.UPDATE_USER,
            "action_type": ProcessActionTypeEnum.SELECTED_USER_IMAGE,
            "data": tempUser
        })
        setUser(tempUser)
        stopCameraStreaming()
        record({ name: 'submitPhoto' })
        return tempUser;
    }

    const registerUser = async () => {
        if (inputValue != "") {
            let userPayload = AppUtility.generateUserPayload();
            userPayload.email = inputValue;
            userPayload.user_id = userId;
            const payload = {
                "action": ProcessActionEnum.ADD_USER,
                "data": userPayload
            }
            await AppApi.dbPostOperation(payload);
            setUser(userPayload);
            record({ name: 'registerUser' })
        }
    }

    const rotateCamera = (side) => {
        const video = document.getElementById('camera-feed');
        video.classList.remove("camera-rotate-left");
        video.classList.remove("camera-rotate-right");
        if (cameraOrientation == 'landscape') {
            setCameraOrientation('portrait')
            setCameraRotation(side);
            if(side == "Left")
                video.classList.add("camera-rotate-left");
            else
                video.classList.add("camera-rotate-right");
        }
        else {
            setCameraOrientation('landscape');
        }

    }

    const controlNavigation = async (detail) => {
        if (detail.requestedStepIndex == 1) {
            if (selectedItems.length == 0) {
                alert('Select Garment')
            } else {
                setIsLoadingNext(true);
                await registerUser();
                setIsLoadingNext(false);
                setActiveStepIndex(detail.requestedStepIndex);
            }
        }
        record({ name: 'controlNavigation', attributes: { key: "page_id" }, metrics: { value: detail.requestedStepIndex } })
    }

    const resetAll = () => {
        setActiveStepIndex(0);
        setInputValue("");
        setUser(null);
        setUserId("");
        setImagecount(1);
        setShowalert(false);
        setSelectedimage(null);
        setSelectedImageBase64(null);
        setSelectedGender(null)
        setGender(null);
        setIsLoadingNext(false);
        setSelectedItems([]);
    }

    const onSetupSubmition = async () => {
        if (selectedImage == null)
            setShowalert(true)
        else {
            setIsLoadingNext(true)
            let tempUser = await submitPhoto();
            tempUser.selected_garment = selectedItems[0].image_id;
            tempUser.process_state = UserStateEnum.GARMENT_SELECTED;
            tempUser.update_on = new Date().toISOString();
            AppApi.dbPostOperation({
                "action": ProcessActionEnum.UPDATE_USER,
                "action_type": ProcessActionTypeEnum.SELECTED_USER_GARMENT,
                "data": tempUser
            })
            await AppApi.confyOperation({
                "model_s3_uri": `s3://${bucketName}/${tempUser.selected_image}`,
                "garment_s3_uri": `s3://${bucketName}/garments/${tempUser.selected_garment}`,
                "output_bucket_name": bucketName,
                "email_id": tempUser.email
            })
            record({ name: 'onSetupSubmition' })
            setQrurl(`https://api.mysampledemo.site/image?id=${user.user_id}`)
            setShowAck(true);
        }
    }

    useEffect(() => {
        setImagecount(1);
        const tempUserId =  AppUtility.guid();
        setUserId(tempUserId);
        setInputValue(`duttanup+${tempUserId}@amazon.com`);
        if (activeStepIndex == 1)
            initializeCamera()
        else
            stopCameraStreaming()

        return () => {
            stopCameraStreaming()
        }
    }, [activeStepIndex])

    useEffect(() => {
        const init = async () => {
            await enable()
            syncMessages();
        }
        init();
    }, [])

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
                resetAll();
                clearAllCanvas();
            }}
            onNavigate={({ detail }) => { controlNavigation(detail) }}
            onSubmit={() => { onSetupSubmition() }}
            activeStepIndex={activeStepIndex}
            steps={[
                {
                    title: "Choose Garment",
                    content: (
                        <Container fitHeight>
                            <SpaceBetween size="l">
                                <SpaceBetween size="l" alignItems="center">
                                    <SegmentedControl selectedId={selectedGender}
                                        label="Default segmented control"
                                        options={[
                                            { text: "Male", id: "male", disabled: (inputValue == "") },
                                            { text: "Female", id: "female", disabled: (inputValue == "") },
                                        ]}
                                        onChange={(event) => {
                                            setSelectedGender(event.detail.selectedId)
                                            setSelectedItems([])
                                            record({ name: 'onChangeGender', attributes: { key: "gender" }, metrics: { value: event.detail.selectedId } })
                                        }}
                                    />
                                    <Cards
                                        entireCardClickable
                                        selectionType="single"
                                        selectedItems={selectedItems}
                                        onSelectionChange={({ detail }) => setSelectedItems(detail?.selectedItems ?? [])}
                                        ariaLabels={{
                                            itemSelectionLabel: (e, t) => `select ${t.name}`,
                                            selectionGroupLabel: "Item selection"
                                        }}
                                        cardDefinition={{
                                            sections: [
                                                {
                                                    id: "image_id",
                                                    content: item => (<StorageImage alt={item.alt} path={`garments/${item.image_id}`} />),
                                                },
                                            ]
                                        }}
                                        cardsPerRow={[
                                            { cards: 1 },
                                            { minWidth: 150, cards: 5 }
                                        ]}
                                        items={garmentList.filter(e => e.gender == selectedGender)}
                                        loadingText="Loading resources"
                                    />
                                </SpaceBetween>
                            </SpaceBetween>
                        </Container>
                    ),
                },
                {
                    title: "Click a Photo",
                    description: "",
                    content: (
                        <Container fitHeight>
                            <SpaceBetween size="xl" alignItems="center">
                                <video id="camera-feed" className="camera-rotate-left" playsInline></video>
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
                                <SpaceBetween direction="horizontal" size="xl">
                                    <img id="camera-img-1" className="camera-img" />
                                    <img id="camera-img-2" className="camera-img" />
                                    <img id="camera-img-3" className="camera-img" />
                                    <img id="camera-img-4" className="camera-img" />
                                    <img id="camera-img-5" className="camera-img" />
                                </SpaceBetween>
                                {
                                    (imagecount > 1) && <Box color="text-body-secondary">Select a image to proceed</Box>
                                }
                                <Alert statusIconAriaLabel="Info" visible={showalert}> Select an image to proceed </Alert>
                            </SpaceBetween>

                        </Container>
                    )
                },
            ]}
        />

        <Modal visible={showAck}>
            <SpaceBetween size="l" alignItems="center">
                <h3>Thank you. Please scan this QR code. Your image will be available after 30 seconds.</h3>
                <QRCode value={qrurl} />
                <h5 style={{ textAlign: "center"}}>In case of any query reach out to us with the id mentioned below <br/> {user?.user_id} </h5>
                <Button variant="primary" onClick={() => { setShowAck(false); resetAll();}}>Close</Button>
            </SpaceBetween>

        </Modal>
    </Container>)
}

export default Fashion