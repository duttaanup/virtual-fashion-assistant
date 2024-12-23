//@ts-nocheck
import { BreadcrumbGroup, Button, CollectionPreferences, Container, Header, Pagination, SpaceBetween, Table, TextFilter, Modal } from "@cloudscape-design/components";
import { AppApi } from "../common/AppApi";
import { StorageImage } from '@aws-amplify/ui-react-storage';
import { useEffect, useState } from "react";
import { AppUtility , UserState} from "../common/Util";

export default function Register() {
    const [userList, setUserList] = useState([]);
    const [currentPageIndex, setCurrentPageIndex] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [totalPages, setTotalPages] = useState(0);
    const [filteringText, setFilteringText] = useState("");
    const [isImageVisible, setIsImageVisible] = useState(false);
    const [isGarmentVisible,setIsGarmentVisible] = useState(false);
    const [userSelectedImagePath, setUserSelectedImagePath] = useState("");
    const [userSelectedGarment,setUserSelectedGarment]= useState("");

    const calculatePagination = (productList) => {
        const totalPages = Math.ceil(productList.length / pageSize);
        setTotalPages(totalPages);
    }

    const filterContent = () => {
        return userList;
    }

    const contentByPagesize = () => {
        const startIndex = (currentPageIndex - 1) * pageSize;
        const endIndex = startIndex + pageSize;
        return filterContent().slice(startIndex, endIndex);
    }

    useEffect(() => {
        calculatePagination(filterContent());
        setCurrentPageIndex(1);
    }, [filteringText, userList, pageSize])

    useEffect(() => {
        const init = async () => {
            const userList = await AppApi.dbGetOperation();
            setUserList(userList)
            calculatePagination(userList)
        }
        init();
    }, [])

    const registerUser = async () => {
        const useremail = window.prompt("Please enter your email", "user@email.com");
        if (useremail) {
            const userId = AppUtility.guid()
            let payload = AppUtility.generateUserPayload();
            payload.user_id = userId;
            payload.email = useremail;
            await AppApi.dbPostOperation({
                "action": "ADD_USER",
                "data": payload
            });
            const userList = await AppApi.dbGetOperation();
            setUserList(userList)
        }
    }

    const showSelectedImage = (item) => {
        setUserSelectedImagePath(item.selected_image)
        setIsImageVisible(true)
    }

    const showSelectedGarment = (item) => {
        setUserSelectedGarment(item.selected_garment);
        setIsGarmentVisible(true);
    }
    return (
        <Container fitHeight header={
            <BreadcrumbGroup
                items={[
                    { text: "Home", href: "#" },
                    { text: "Registration", href: "/registration" },
                ]}
            />
        }>
            <Table
                sortingDescending
                sortingDisabled
                stripedRows
                stickyHeader
                variant="embedded"
                contentDensity="comfortable"
                columnDefinitions={[
                    {
                        id: "email",
                        header: "Email",
                        cell: e => e.email,
                        isRowHeader: true,
                    },
                    {
                        id: "user_id",
                        header: "User ID",
                        cell: e => e.user_id,
                    },
                    {
                        id: "process_state",
                        header: "Process State",
                        cell: e => e.process_state,
                    },
                    {
                        id: "selected_image",
                        header: "Selected Image",
                        cell: e => e.selected_image,
                    },
                    {
                        id: "create_on",
                        header: "Create On",
                        cell: e => e.create_on,
                    },
                    {
                        id: "update_on",
                        header: "Update On",
                        cell: e => AppUtility.isoToLocalTime(e.update_on),
                    },
                    {
                        id: "action",
                        header: "",
                        cell: e => (<SpaceBetween size="s" direction="horizontal">
                            <Button iconName="user-profile-active"  onClick={() => { showSelectedImage(e) }} disabled={e.selected_image == ""}/>
                            <Button iconName="map"  onClick={() => { showSelectedGarment(e) }} disabled={e.selected_garment == ""}/>
                            <Button iconName="full-screen" onClick={() => { console.log(e.user_id) }} disabled={true}/>
                            <Button iconName="send" onClick={() => { console.log(e) }} disabled={true}/>
                        </SpaceBetween>),
                    }
                ]}
                columnDisplay={[
                    { id: "email", visible: true },
                    { id: "user_id", visible: true },
                    { id: "process_state", visible: true },
                    { id: "selected_image", visible: false },
                    { id: "create_on", visible: false },
                    { id: "update_on", visible: true },
                    { id: "action", visible: true }
                ]}
                items={contentByPagesize()}
                loadingText="Loading users"
                filter={
                    <TextFilter
                        filteringPlaceholder="Find User"
                        filteringText={filteringText}
                    />
                }
                header={
                    <Header
                        actions={<Button variant="primary" onClick={() => { registerUser() }}>
                            Register User
                        </Button>}
                    >
                        User Registration
                    </Header>
                }
                pagination={
                    <Pagination currentPageIndex={currentPageIndex} pagesCount={totalPages} onChange={({ detail }) => { setCurrentPageIndex(detail.currentPageIndex) }} />
                }
                preferences={
                    <CollectionPreferences
                        title="Preferences"
                        confirmLabel="Confirm"
                        cancelLabel="Cancel"
                        preferences={{
                            pageSize: pageSize,
                        }}
                        onConfirm={({ detail }) => {
                            setPageSize(detail.pageSize);
                            calculatePagination(userList);
                            setCurrentPageIndex(1);
                        }}
                        pageSizePreference={{
                            title: "Page size",
                            options: [
                                { value: 10, label: "10 resources" },
                                { value: 20, label: "20 resources" },
                                { value: 30, label: "30 resources" },
                                { value: 40, label: "40 resources" },
                                { value: 50, label: "50 resources" }
                            ]
                        }}
                    />
                }
            />

        <Modal visible={isImageVisible} onDismiss={() => {
            setIsImageVisible(false)
        }}>
            {userSelectedImagePath != "" && <StorageImage alt="alt text" path={userSelectedImagePath}/>}
        </Modal>

        <Modal visible={isGarmentVisible} onDismiss={() => {
            setIsGarmentVisible(false)
        }}>
            <img src={userSelectedGarment}/>
        </Modal>

        </Container>
    );

}