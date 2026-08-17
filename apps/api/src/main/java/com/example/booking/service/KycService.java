package com.example.booking.service;

import com.example.booking.dto.kyc.BindBankRequest;
import com.example.booking.dto.kyc.KycAdminResponse;
import com.example.booking.dto.kyc.KycStatusResponse;
import com.example.booking.dto.kyc.KycSubmitRequest;
import com.example.booking.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface KycService {

    KycStatusResponse getStatus(User user);

    KycStatusResponse submit(User user, KycSubmitRequest request);

    void bindBankAccount(User user, BindBankRequest request);

    Page<KycAdminResponse> listPending(Pageable pageable);

    Page<KycAdminResponse> listAll(Pageable pageable);

    KycAdminResponse approve(Long userId, String targetLevel, String bankCode, String accountNumber, String actor);

    KycAdminResponse reject(Long userId, String reason, String actor);
}
