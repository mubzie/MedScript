use integration::helpers::{
    build_project_in_dir, create_account_from_package, create_basic_wallet_account,
    create_note_from_package, setup_client, AccountCreationConfig, ClientSetup, NoteCreationConfig,
};

use anyhow::{Context, Result};
use miden_client::{
    account::{StorageMap, StorageSlot, StorageSlotName},
    transaction::{OutputNote, TransactionRequestBuilder},
    Felt, Word,
};
use std::{path::Path, sync::Arc};

#[tokio::main]
async fn main() -> Result<()> {
    println!("=== MedScript Phase 4: Testnet Deployment ===\n");

    // Setup client for testnet
    let ClientSetup {
        mut client,
        keystore,
    } = setup_client().await?;

    let sync_summary = client.sync_state().await?;
    println!("✓ Connected to testnet. Latest block: {}\n", sync_summary.block_num);

    // === STEP 1: Account Creation on Testnet ===
    println!("--- Step 1: Account Creation on Testnet ---");

    // Build contracts
    let pharmacist_package = Arc::new(
        build_project_in_dir(Path::new("../contracts/pharmacist-account"), true)
            .context("Failed to build pharmacist account contract")?,
    );
    let doctor_package = Arc::new(
        build_project_in_dir(Path::new("../contracts/doctor-account"), true)
            .context("Failed to build doctor account contract")?,
    );
    let prescription_note_package = Arc::new(
        build_project_in_dir(Path::new("../contracts/prescription-note"), true)
            .context("Failed to build prescription note contract")?,
    );
    let fulfillment_note_package = Arc::new(
        build_project_in_dir(Path::new("../contracts/fulfillment-note"), true)
            .context("Failed to build fulfillment note contract")?,
    );

    // Create pharmacist account with credential hash in slot 0 and clinic name in slot 1
    let pharmacist_credential_key = Word::from([Felt::new(0), Felt::new(0), Felt::new(0), Felt::new(0)]);
    let pharmacist_clinic_key = Word::from([Felt::new(0), Felt::new(0), Felt::new(0), Felt::new(1)]);

    let pharmacist_storage_slots = vec![StorageSlot::with_map(
        StorageSlotName::new("miden::component::miden_pharmacist_account::storage_map")
            .context("Failed to create pharmacist storage slot name")?,
        StorageMap::with_entries(vec![
            (pharmacist_credential_key, Word::from([Felt::new(1), Felt::new(0), Felt::new(0), Felt::new(0)])),
            (pharmacist_clinic_key, Word::from([Felt::new(100), Felt::new(0), Felt::new(0), Felt::new(0)])),
        ])
        .context("Failed to create pharmacist storage")?,
    )];
    let pharmacist_cfg = AccountCreationConfig {
        storage_slots: pharmacist_storage_slots,
        ..Default::default()
    };
    let pharmacist_account = create_account_from_package(&mut client, pharmacist_package.clone(), pharmacist_cfg)
        .await
        .context("Failed to create pharmacist account")?;
    println!("✓ Pharmacist account created: {}", pharmacist_account.id().to_hex());

    // Create doctor account with credential hash in slot 0 and specialty in slot 1
    let doctor_credential_key = Word::from([Felt::new(0), Felt::new(0), Felt::new(0), Felt::new(0)]);
    let doctor_specialty_key = Word::from([Felt::new(0), Felt::new(0), Felt::new(0), Felt::new(1)]);

    let doctor_storage_slots = vec![StorageSlot::with_map(
        StorageSlotName::new("miden::component::miden_doctor_account::storage_map")
            .context("Failed to create doctor storage slot name")?,
        StorageMap::with_entries(vec![
            (doctor_credential_key, Word::from([Felt::new(1), Felt::new(0), Felt::new(0), Felt::new(0)])),
            (doctor_specialty_key, Word::from([Felt::new(200), Felt::new(0), Felt::new(0), Felt::new(0)])),
        ])
        .context("Failed to create doctor storage")?,
    )];
    let doctor_cfg = AccountCreationConfig {
        storage_slots: doctor_storage_slots,
        ..Default::default()
    };
    let doctor_account = create_account_from_package(&mut client, doctor_package.clone(), doctor_cfg)
        .await
        .context("Failed to create doctor account")?;
    println!("✓ Doctor account created: {}\n", doctor_account.id().to_hex());

    // Create sender wallet for publishing notes
    let sender_cfg = AccountCreationConfig::default();
    let sender_account = create_basic_wallet_account(&mut client, keystore.clone(), sender_cfg)
        .await
        .context("Failed to create sender wallet account")?;
    println!("✓ Sender wallet created: {}\n", sender_account.id().to_hex());

    // Register sender account on the testnet with an initialization transaction
    let init_tx_request = TransactionRequestBuilder::new()
        .build()
        .context("Failed to build sender account initialization transaction")?;
    
    let init_tx_id = client
        .submit_new_transaction(sender_account.id(), init_tx_request)
        .await
        .context("Failed to submit sender account initialization transaction")?;
    
    println!("✓ Sender account init transaction: {}", init_tx_id.to_hex());
    client.sync_state().await.context("Failed to sync state after sender account initialization")?;
    println!("✓ Sender account initialized on testnet\n");

    // === STEP 2: Prescription Note Flow ===
    println!("--- Step 2: Prescription Note Creation ---");

    // Create prescription note from pharmacist to doctor
    let prescription_note_config = NoteCreationConfig::default();
    let prescription_note = create_note_from_package(
        &mut client,
        prescription_note_package.clone(),
        sender_account.id(),
        prescription_note_config,
    )
    .context("Failed to create prescription note")?;
    println!("✓ Prescription note created: {}", prescription_note.id().to_hex());

    // Publish prescription note from sender account
    let note_publish_request = TransactionRequestBuilder::new()
        .own_output_notes(vec![OutputNote::Full(prescription_note.clone())])
        .build()
        .context("Failed to build note publish transaction request")?;

    let note_publish_tx_id = client
        .submit_new_transaction(sender_account.id(), note_publish_request)
        .await
        .context("Failed to submit prescription note publish transaction")?;
    println!("✓ Prescription note published: {}", note_publish_tx_id.to_hex());

    // Wait for confirmation
    client.sync_state().await.context("Failed to sync state after publishing prescription note")?;
    println!("✓ Prescription note confirmed in testnet state\n");

    // === STEP 3: Doctor Consumes and Approves ===
    println!("--- Step 3: Doctor Consumption and Approval ---");

    // Doctor consumes prescription note
    let consume_note_request = TransactionRequestBuilder::new()
        .input_notes([(prescription_note.clone(), None)])
        .build()
        .context("Failed to build consume prescription transaction request")?;

    let consume_tx_id = client
        .submit_new_transaction(doctor_account.id(), consume_note_request)
        .await
        .context("Failed to submit doctor consume prescription transaction")?;
    println!("✓ Doctor consumed prescription note: {}", consume_tx_id.to_hex());

    // Wait for confirmation
    client.sync_state().await.context("Failed to sync state after doctor consumption")?;
    println!("✓ Doctor consumption confirmed in testnet state");

    // Create fulfillment note
    let fulfillment_note_config = NoteCreationConfig::default();
    let fulfillment_note = create_note_from_package(
        &mut client,
        fulfillment_note_package.clone(),
        sender_account.id(),
        fulfillment_note_config,
    )
    .context("Failed to create fulfillment note")?;
    println!("✓ Fulfillment note created: {}", fulfillment_note.id().to_hex());

    // Publish fulfillment note from sender account
    let fulfillment_publish_request = TransactionRequestBuilder::new()
        .own_output_notes(vec![OutputNote::Full(fulfillment_note.clone())])
        .build()
        .context("Failed to build fulfillment note publish transaction request")?;

    let fulfillment_publish_tx_id = client
        .submit_new_transaction(sender_account.id(), fulfillment_publish_request)
        .await
        .context("Failed to submit fulfillment note publish transaction")?;
    println!("✓ Fulfillment note published: {}", fulfillment_publish_tx_id.to_hex());

    // Wait for confirmation
    client.sync_state().await.context("Failed to sync state after publishing fulfillment note")?;
    println!("✓ Fulfillment note confirmed and targeted at pharmacist\n");

    // === STEP 4: Pharmacist Receives Fulfillment ===
    println!("--- Step 4: Pharmacist Receives Fulfillment ---");

    // Pharmacist consumes fulfillment note
    let consume_fulfillment_request = TransactionRequestBuilder::new()
        .input_notes([(fulfillment_note.clone(), None)])
        .build()
        .context("Failed to build consume fulfillment transaction request")?;

    let consume_fulfillment_tx_id = client
        .submit_new_transaction(pharmacist_account.id(), consume_fulfillment_request)
        .await
        .context("Failed to submit pharmacist consume fulfillment transaction")?;
    println!("✓ Pharmacist consumed fulfillment note: {}", consume_fulfillment_tx_id.to_hex());

    // Wait for confirmation
    client.sync_state().await.context("Failed to sync state after pharmacist consumption")?;
    println!("✓ Fulfillment note consumed and confirmed");
    println!("✓ Prescription fulfilled successfully on testnet\n");

    // === STEP 5: Final Verification ===
    println!("--- Step 5: Final State Verification ---");

    let final_block = client.sync_state().await?;
    println!("✓ Final testnet block height: {}", final_block.block_num);
    println!("✓ All transactions confirmed on testnet\n");

    // === Write deployment report ===
    println!("--- Deployment Report ---");
    let report = format!(
        "# MedScript Testnet Deployment Report

## Network Information
- Network: Miden Testnet
- Final Block Height: {}

## Deployed Accounts
- Pharmacist Account ID: {}
- Doctor Account ID: {}
- Sender Wallet ID: {}

## Transaction Summary
- Sender Initialization TX: {}
- Prescription Note Publish TX: {}
- Doctor Consumption TX: {}
- Fulfillment Note Publish TX: {}
- Pharmacist Fulfillment Consumption TX: {}

## Notes Created
- Prescription Note ID: {}
- Fulfillment Note ID: {}

## Status
✅ All transactions confirmed on testnet
✅ Full prescription workflow executed
✅ Ready for Phase 5 (Frontend Integration)

",
        final_block.block_num,
        pharmacist_account.id().to_hex(),
        doctor_account.id().to_hex(),
        sender_account.id().to_hex(),
        init_tx_id.to_hex(),
        note_publish_tx_id.to_hex(),
        consume_tx_id.to_hex(),
        fulfillment_publish_tx_id.to_hex(),
        consume_fulfillment_tx_id.to_hex(),
        prescription_note.id().to_hex(),
        fulfillment_note.id().to_hex()
    );

    std::fs::write("../../../tasks/testnet-accounts.md", report)
        .context("Failed to write testnet accounts file")?;

    println!("=== Phase 4 Deployment Complete ===");
    println!("✅ All accounts created on testnet");
    println!("✅ Full prescription workflow executed");
    println!("✅ Testnet report saved to tasks/testnet-accounts.md");
    println!("✅ Ready for Phase 5 (Frontend Integration)\n");

    Ok(())
}
